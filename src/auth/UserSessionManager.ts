// Función para generar UUID sin dependencias externas
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface UserSession {
  userId: string;
  activeConstructor: string; // ÚNICO constructor activo
  previousConstructors: string[]; // Histórico para limpieza
  sessionTimestamp: number;
  maxConstructors: number; // SIEMPRE = 1
  sessionId: string;
  expiresAt: number; // 24h desde creación
}

interface Constructor {
  id: string;
  userId: string;
  name: string;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
    isActive: boolean;
  };
  integrations: {
    whatsapp: boolean;
    telegram: boolean;
    webchat: boolean;
  };
}

export class UserSessionManager {
  private static instance: UserSessionManager;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas
  private readonly STORAGE_KEY = 'cognibot_user_session';
  private readonly CONSTRUCTOR_KEY = 'cognibot_constructors';
  
  private constructor() {
    this.initializeCleanup();
  }

  static getInstance(): UserSessionManager {
    if (!UserSessionManager.instance) {
      UserSessionManager.instance = new UserSessionManager();
    }
    return UserSessionManager.instance;
  }

  // MÉTODO PRINCIPAL: Obtener o crear constructor único
  async getOrCreateConstructor(userId: string): Promise<Constructor> {
    console.log(`[SessionManager] Getting/creating constructor for user: ${userId}`);
    
    try {
      // 1. Verificar sesión existente
      const existingSession = this.getUserSession(userId);
      
      if (existingSession && this.isSessionValid(existingSession)) {
        console.log('[SessionManager] Valid session found, loading active constructor');
        
        // Cargar constructor activo
        const activeConstructor = await this.loadActiveConstructor(existingSession.activeConstructor);
        
        if (activeConstructor) {
          // Renovar sesión
          this.renewSession(existingSession);
          return activeConstructor;
        }
      }

      // 2. Limpiar constructores antiguos
      await this.cleanUserConstructors(userId);

      // 3. Crear nuevo constructor único
      const newConstructor = await this.createUniqueConstructor(userId);

      // 4. Crear nueva sesión
      const newSession: UserSession = {
        userId,
        activeConstructor: newConstructor.id,
        previousConstructors: [],
        sessionTimestamp: Date.now(),
        maxConstructors: 1,
        sessionId: generateUUID(),
        expiresAt: Date.now() + this.SESSION_DURATION,
      };

      // 5. Guardar sesión
      this.saveUserSession(newSession);

      console.log(`[SessionManager] Created new constructor: ${newConstructor.id}`);
      return newConstructor;

    } catch (error) {
      console.error('[SessionManager] Error in getOrCreateConstructor:', error);
      throw new Error('Failed to initialize user constructor');
    }
  }

  // Validar sesión activa
  validateSession(userId: string): boolean {
    const session = this.getUserSession(userId);
    return session ? this.isSessionValid(session) : false;
  }

  // Limpiar constructores antiguos del usuario
  async cleanUserConstructors(userId: string): Promise<void> {
    console.log(`[SessionManager] Cleaning old constructors for user: ${userId}`);
    
    try {
      const allConstructors = this.getAllConstructors();
      const userConstructors = allConstructors.filter(c => c.userId === userId);
      
      if (userConstructors.length === 0) {
        console.log('[SessionManager] No constructors to clean');
        return;
      }

      // Mantener solo el más reciente si existe
      const sortedConstructors = userConstructors.sort((a, b) => 
        b.metadata.updatedAt - a.metadata.updatedAt
      );

      // Eliminar todos excepto el más reciente (si existe)
      const constructorsToDelete = sortedConstructors.slice(1);
      
      for (const constructor of constructorsToDelete) {
        await this.deleteConstructor(constructor.id);
        console.log(`[SessionManager] Deleted old constructor: ${constructor.id}`);
      }

      // Desactivar el constructor restante para crear uno nuevo
      if (sortedConstructors.length > 0) {
        const remaining = sortedConstructors[0];
        remaining.metadata.isActive = false;
        this.saveConstructor(remaining);
      }

    } catch (error) {
      console.error('[SessionManager] Error cleaning constructors:', error);
    }
  }

  // Obtener constructor activo del usuario
  async getActiveConstructor(userId: string): Promise<Constructor | null> {
    const session = this.getUserSession(userId);
    
    if (!session || !this.isSessionValid(session)) {
      return null;
    }

    return this.loadActiveConstructor(session.activeConstructor);
  }

  // Actualizar constructor activo
  async updateActiveConstructor(userId: string, constructorData: Partial<Constructor>): Promise<void> {
    const session = this.getUserSession(userId);
    
    if (!session || !this.isSessionValid(session)) {
      throw new Error('Invalid session');
    }

    const constructor = await this.loadActiveConstructor(session.activeConstructor);
    
    if (!constructor) {
      throw new Error('Active constructor not found');
    }

    // Actualizar datos
    const updatedConstructor: Constructor = {
      ...constructor,
      ...constructorData,
      metadata: {
        ...constructor.metadata,
        ...constructorData.metadata,
        updatedAt: Date.now(),
      },
    };

    this.saveConstructor(updatedConstructor);
    console.log(`[SessionManager] Updated constructor: ${constructor.id}`);
  }

  // Renovar sesión existente
  renewSession(session: UserSession): void {
    const renewedSession: UserSession = {
      ...session,
      sessionTimestamp: Date.now(),
      expiresAt: Date.now() + this.SESSION_DURATION,
    };

    this.saveUserSession(renewedSession);
    console.log(`[SessionManager] Session renewed for user: ${session.userId}`);
  }

  // Cerrar sesión y limpiar
  async closeSession(userId: string): Promise<void> {
    console.log(`[SessionManager] Closing session for user: ${userId}`);
    
    try {
      // Guardar constructor antes de cerrar
      const constructor = await this.getActiveConstructor(userId);
      if (constructor) {
        constructor.metadata.isActive = false;
        this.saveConstructor(constructor);
      }

      // Eliminar sesión
      this.clearUserSession(userId);
      
    } catch (error) {
      console.error('[SessionManager] Error closing session:', error);
    }
  }

  // MÉTODOS PRIVADOS

  private async createUniqueConstructor(userId: string): Promise<Constructor> {
    const constructorId = `constructor_${userId}_${Date.now()}`;
    
    const newConstructor: Constructor = {
      id: constructorId,
      userId,
      name: 'Mi Chatbot',
      nodes: [
        {
          id: 'start-node',
          type: 'message',
          position: { x: 250, y: 100 },
          data: {
            label: 'Inicio',
            text: '¡Hola! Bienvenido a mi chatbot.',
          },
        },
      ],
      edges: [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        isActive: true,
      },
      integrations: {
        whatsapp: false,
        telegram: false,
        webchat: true,
      },
    };

    this.saveConstructor(newConstructor);
    return newConstructor;
  }

  private async loadActiveConstructor(constructorId: string): Promise<Constructor | null> {
    try {
      const allConstructors = this.getAllConstructors();
      const constructor = allConstructors.find(c => c.id === constructorId);
      
      if (constructor && constructor.metadata.isActive) {
        return constructor;
      }
      
      return null;
    } catch (error) {
      console.error('[SessionManager] Error loading constructor:', error);
      return null;
    }
  }

  private getUserSession(userId: string): UserSession | null {
    try {
      const sessionsData = localStorage.getItem(this.STORAGE_KEY);
      if (!sessionsData) return null;

      const sessions: Record<string, UserSession> = JSON.parse(sessionsData);
      return sessions[userId] || null;
    } catch (error) {
      console.error('[SessionManager] Error getting user session:', error);
      return null;
    }
  }

  private saveUserSession(session: UserSession): void {
    try {
      const sessionsData = localStorage.getItem(this.STORAGE_KEY) || '{}';
      const sessions: Record<string, UserSession> = JSON.parse(sessionsData);
      
      sessions[session.userId] = session;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('[SessionManager] Error saving user session:', error);
    }
  }

  private clearUserSession(userId: string): void {
    try {
      const sessionsData = localStorage.getItem(this.STORAGE_KEY);
      if (!sessionsData) return;

      const sessions: Record<string, UserSession> = JSON.parse(sessionsData);
      delete sessions[userId];
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('[SessionManager] Error clearing user session:', error);
    }
  }

  private isSessionValid(session: UserSession): boolean {
    const now = Date.now();
    return session.expiresAt > now;
  }

  private getAllConstructors(): Constructor[] {
    try {
      const constructorsData = localStorage.getItem(this.CONSTRUCTOR_KEY);
      return constructorsData ? JSON.parse(constructorsData) : [];
    } catch (error) {
      console.error('[SessionManager] Error getting constructors:', error);
      return [];
    }
  }

  private saveConstructor(constructor: Constructor): void {
    try {
      const allConstructors = this.getAllConstructors();
      const index = allConstructors.findIndex(c => c.id === constructor.id);
      
      if (index >= 0) {
        allConstructors[index] = constructor;
      } else {
        allConstructors.push(constructor);
      }
      
      localStorage.setItem(this.CONSTRUCTOR_KEY, JSON.stringify(allConstructors));
    } catch (error) {
      console.error('[SessionManager] Error saving constructor:', error);
    }
  }

  private async deleteConstructor(constructorId: string): Promise<void> {
    try {
      const allConstructors = this.getAllConstructors();
      const filteredConstructors = allConstructors.filter(c => c.id !== constructorId);
      
      localStorage.setItem(this.CONSTRUCTOR_KEY, JSON.stringify(filteredConstructors));
    } catch (error) {
      console.error('[SessionManager] Error deleting constructor:', error);
    }
  }

  private initializeCleanup(): void {
    // Limpiar sesiones expiradas al inicializar
    this.clearExpiredSessions();
    
    // Configurar limpieza periódica cada hora
    setInterval(() => {
      this.clearExpiredSessions();
    }, 60 * 60 * 1000);
  }

  private clearExpiredSessions(): void {
    try {
      const sessionsData = localStorage.getItem(this.STORAGE_KEY);
      if (!sessionsData) return;

      const sessions: Record<string, UserSession> = JSON.parse(sessionsData);
      const now = Date.now();
      let cleanedCount = 0;

      Object.keys(sessions).forEach(userId => {
        if (sessions[userId].expiresAt <= now) {
          delete sessions[userId];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
        console.log(`[SessionManager] Cleaned ${cleanedCount} expired sessions`);
      }
    } catch (error) {
      console.error('[SessionManager] Error cleaning expired sessions:', error);
    }
  }

  // Métodos públicos para debugging
  getSessionInfo(userId: string): Record<string, unknown> | null {
    const session = this.getUserSession(userId);
    if (!session) return null;

    return {
      userId: session.userId,
      activeConstructor: session.activeConstructor,
      sessionAge: Date.now() - session.sessionTimestamp,
      isValid: this.isSessionValid(session),
      expiresIn: session.expiresAt - Date.now(),
    };
  }

  getAllUserConstructors(userId: string): Constructor[] {
    return this.getAllConstructors().filter(c => c.userId === userId);
  }
}
