import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserSessionManager } from '../../auth/UserSessionManager';
import { ConstructorService } from '../../constructor/ConstructorService';
import { BuilderProvider } from '../../patterns/BuilderContext';
// import { LazyBuilderComponents } from '../../utils/lazyComponents';
import { PWAManager } from '../../pwa/SimplePWAManager';
import { LoadingState } from '../ui/loading-states';
import { BuilderErrorBoundary } from '../error/BuilderErrorBoundary';
import { 
  Bot, 
  Settings, 
  MessageSquare, 
  BarChart3, 
  Zap, 
  Shield,
  Wifi,
  WifiOff,
  Download,
  Sparkles
} from 'lucide-react';

interface DashboardState {
  isLoading: boolean;
  constructor: any | null;
  stats: any | null;
  sessionInfo: any | null;
  isOnline: boolean;
  aiEnginesStatus: Record<string, boolean>;
  anomalies: any[];
  error: string | null;
}

interface DashboardManagerProps {
  userId: string;
  initialView?: 'dashboard' | 'constructor' | 'integrations' | 'conversations';
}

export const DashboardManager: React.FC<DashboardManagerProps> = ({
  userId,
  initialView = 'dashboard'
}) => {
  const [state, setState] = useState<DashboardState>({
    isLoading: true,
    constructor: null,
    stats: null,
    sessionInfo: null,
    isOnline: navigator.onLine,
    aiEnginesStatus: {},
    anomalies: [],
    error: null,
  });

  const [currentView, setCurrentView] = useState(initialView);
  const [pwaManager] = useState(() => new PWAManager());
  
  const sessionManager = useMemo(() => UserSessionManager.getInstance(), []);
  const constructorService = useMemo(() => ConstructorService.getInstance(), []);

  // Inicializar sesión y constructor único
  const initializeUserSession = useCallback(async () => {
    console.log('[DashboardManager] Initializing user session...');
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Obtener o crear constructor único
      const constructor = await constructorService.createUniqueConstructor(userId);
      
      // 2. Obtener estadísticas
      const stats = await constructorService.getConstructorStats(userId);
      
      // 3. Obtener información de sesión
      const sessionInfo = sessionManager.getSessionInfo(userId);
      
      // 4. Obtener estado de engines IA
      const aiEnginesStatus = constructorService.getAIEnginesStatus();
      
      // 5. Detectar anomalías
      const anomalies = await constructorService.detectFlowAnomalies(userId);

      setState(prev => ({
        ...prev,
        isLoading: false,
        constructor,
        stats,
        sessionInfo,
        aiEnginesStatus,
        anomalies,
      }));

      console.log('[DashboardManager] Session initialized successfully');

    } catch (error) {
      console.error('[DashboardManager] Failed to initialize session:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize session',
      }));
    }
  }, [userId, sessionManager, constructorService]);

  // Cargar constructor activo
  const loadActiveConstructor = useCallback(async () => {
    try {
      const constructor = await constructorService.getActiveConstructor(userId);
      const stats = await constructorService.getConstructorStats(userId);
      
      setState(prev => ({
        ...prev,
        constructor,
        stats,
      }));

    } catch (error) {
      console.error('[DashboardManager] Failed to load constructor:', error);
    }
  }, [userId, constructorService]);

  // Limpiar constructores antiguos
  const cleanOldConstructors = useCallback(async () => {
    try {
      await sessionManager.cleanUserConstructors(userId);
      await loadActiveConstructor();
      
      console.log('[DashboardManager] Old constructors cleaned');
    } catch (error) {
      console.error('[DashboardManager] Failed to clean constructors:', error);
    }
  }, [userId, sessionManager, loadActiveConstructor]);

  // Efectos
  useEffect(() => {
    initializeUserSession();
  }, [initializeUserSession]);

  useEffect(() => {
    // Listeners para estado online/offline
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Configurar PWA events
  useEffect(() => {
    pwaManager.on('update_available', () => {
      console.log('[DashboardManager] PWA update available');
    });

    pwaManager.on('installed', () => {
      console.log('[DashboardManager] PWA installed');
    });
  }, [pwaManager]);

  // Handlers
  const handleViewChange = useCallback((view: string) => {
    setCurrentView(view);
  }, []);

  const handleConstructorUpdate = useCallback(async (updates: any) => {
    try {
      await constructorService.updateConstructor(userId, updates);
      await loadActiveConstructor();
    } catch (error) {
      console.error('[DashboardManager] Failed to update constructor:', error);
    }
  }, [userId, constructorService, loadActiveConstructor]);

  const handleIntegrationToggle = useCallback(async (integration: string, enabled: boolean) => {
    try {
      await constructorService.configureIntegration(userId, integration, enabled);
      await loadActiveConstructor();
    } catch (error) {
      console.error('[DashboardManager] Failed to toggle integration:', error);
    }
  }, [userId, constructorService, loadActiveConstructor]);

  // Renderizado condicional
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingState 
          type="loading" 
          size="lg" 
          message="Inicializando constructor único..." 
        />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error de Inicialización
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {state.error}
          </p>
          <button
            onClick={initializeUserSession}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <BuilderErrorBoundary level="page">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header con indicadores */}
        <DashboardHeader
          constructor={state.constructor}
          sessionInfo={state.sessionInfo}
          isOnline={state.isOnline}
          aiEnginesStatus={state.aiEnginesStatus}
          anomalies={state.anomalies}
          onCleanConstructors={cleanOldConstructors}
        />

        {/* Navegación */}
        <DashboardNavigation
          currentView={currentView}
          onViewChange={handleViewChange}
          stats={state.stats}
          hasAnomalies={state.anomalies.length > 0}
        />

        {/* Contenido principal */}
        <main className="container mx-auto px-4 py-6">
          <BuilderProvider>
            {currentView === 'dashboard' && (
              <DashboardOverview
                constructor={state.constructor}
                stats={state.stats}
                anomalies={state.anomalies}
                aiEnginesStatus={state.aiEnginesStatus}
              />
            )}

            {currentView === 'constructor' && state.constructor && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Constructor Activo</h2>
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Constructor único cargado y listo para usar
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Nodos: {state.constructor.nodes?.length || 0} | 
                    Conexiones: {state.constructor.edges?.length || 0}
                  </p>
                </div>
              </div>
            )}

            {currentView === 'integrations' && (
              <IntegrationsView
                constructor={state.constructor}
                onIntegrationToggle={handleIntegrationToggle}
              />
            )}

            {currentView === 'conversations' && (
              <ConversationsView
                constructor={state.constructor}
              />
            )}
          </BuilderProvider>
        </main>
      </div>
    </BuilderErrorBoundary>
  );
};

// Componente Header
const DashboardHeader: React.FC<{
  constructor: any;
  sessionInfo: any;
  isOnline: boolean;
  aiEnginesStatus: Record<string, boolean>;
  anomalies: any[];
  onCleanConstructors: () => void;
}> = ({ constructor, sessionInfo, isOnline, aiEnginesStatus, anomalies, onCleanConstructors }) => {
  const activeAICount = Object.values(aiEnginesStatus).filter(Boolean).length;
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Bot className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {constructor?.name || 'CogniBot Constructor'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Constructor único activo
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Estado de conexión */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Estado IA */}
            {activeAICount > 0 && (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activeAICount} IA activa{activeAICount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Anomalías */}
            {anomalies.length > 0 && (
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {anomalies.length} alerta{anomalies.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Botón limpiar */}
            <button
              onClick={onCleanConstructors}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Limpiar constructores antiguos"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente Navegación
const DashboardNavigation: React.FC<{
  currentView: string;
  onViewChange: (view: string) => void;
  stats: any;
  hasAnomalies: boolean;
}> = ({ currentView, onViewChange, stats, hasAnomalies }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'constructor', label: 'Constructor', icon: Bot, badge: stats?.nodeCount },
    { id: 'integrations', label: 'Integraciones', icon: Settings, badge: stats?.integrationCount },
    { id: 'conversations', label: 'Conversaciones', icon: MessageSquare, alert: hasAnomalies },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors relative
                  ${isActive 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                
                {item.badge && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {item.badge}
                  </span>
                )}
                
                {item.alert && (
                  <span className="ml-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// Componente Overview
const DashboardOverview: React.FC<{
  constructor: any;
  stats: any;
  anomalies: any[];
  aiEnginesStatus: Record<string, boolean>;
}> = ({ constructor, stats, anomalies, aiEnginesStatus }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Bot className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nodos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.nodeCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Integraciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.integrationCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">IA Activa</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Object.values(aiEnginesStatus).filter(Boolean).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alertas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {anomalies.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies Alert */}
      {anomalies.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Anomalías Detectadas
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <ul className="list-disc list-inside space-y-1">
                  {anomalies.slice(0, 3).map((anomaly, index) => (
                    <li key={index}>{anomaly.description}</li>
                  ))}
                  {anomalies.length > 3 && (
                    <li>Y {anomalies.length - 3} más...</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Constructor Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Constructor Activo
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {constructor?.name || 'Sin nombre'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Última actualización:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {stats?.lastModified ? new Date(stats.lastModified).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Funciones IA:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {stats?.aiFeatures?.join(', ') || 'Ninguna'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components
const IntegrationsView: React.FC<{
  constructor: any;
  onIntegrationToggle: (integration: string, enabled: boolean) => void;
}> = ({ constructor, onIntegrationToggle }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
    <h2 className="text-lg font-semibold mb-4">Integraciones</h2>
    <p className="text-gray-600 dark:text-gray-400">
      Configuración de integraciones para el constructor único.
    </p>
  </div>
);

const ConversationsView: React.FC<{ constructor: any }> = ({ constructor }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
    <h2 className="text-lg font-semibold mb-4">Conversaciones</h2>
    <p className="text-gray-600 dark:text-gray-400">
      Historial de conversaciones del constructor activo.
    </p>
  </div>
);
