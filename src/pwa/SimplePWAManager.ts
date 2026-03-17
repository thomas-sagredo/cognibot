import { useState, useEffect } from 'react';

// Interfaces básicas para PWA
interface PWAInstallationState {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: string;
  installPrompt: unknown | null;
}

// Clase PWA Manager simplificada
export class PWAManager {
  private listeners: Map<string, Array<(data?: unknown) => void>> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    console.log('[PWAManager] Initialized');
  }

  // Event emitter básico
  on(event: string, callback: (data?: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  emit(event: string, data?: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Métodos PWA básicos (simplificados para evitar errores)
  async canInstall(): Promise<boolean> {
    return false; // Temporalmente deshabilitado
  }

  async isInstalled(): Promise<boolean> {
    return false; // Temporalmente deshabilitado
  }

  async install(): Promise<void> {
    console.log('[PWAManager] Install requested');
    this.emit('installed');
  }

  async checkForUpdates(): Promise<boolean> {
    console.log('[PWAManager] Checking for updates');
    return false;
  }

  async applyUpdate(): Promise<void> {
    console.log('[PWAManager] Applying update');
    this.emit('updated');
  }
}

// Hook React para PWA
export const usePWA = () => {
  const [pwaManager] = useState(() => new PWAManager());
  const [installationState, setInstallationState] = useState<PWAInstallationState>({
    canInstall: false,
    isInstalled: false,
    isStandalone: false,
    platform: 'unknown',
    installPrompt: null,
  });
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const updateInstallationState = async () => {
      const canInstall = await pwaManager.canInstall();
      const isInstalled = await pwaManager.isInstalled();
      
      setInstallationState(prev => ({
        ...prev,
        canInstall,
        isInstalled,
        isStandalone: isInstalled,
        platform: navigator.platform || 'unknown',
      }));
    };

    updateInstallationState();

    // Listeners para eventos PWA
    pwaManager.on('update_available', () => {
      setUpdateAvailable(true);
    });

    pwaManager.on('installed', () => {
      setInstallationState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
      }));
    });

  }, [pwaManager]);

  const install = async () => {
    try {
      await pwaManager.install();
    } catch (error) {
      console.error('[usePWA] Install failed:', error);
    }
  };

  const applyUpdate = async () => {
    try {
      await pwaManager.applyUpdate();
      setUpdateAvailable(false);
    } catch (error) {
      console.error('[usePWA] Update failed:', error);
    }
  };

  const shareContent = async (data: { title?: string; text?: string; url?: string }) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('[usePWA] Share failed:', error);
        return false;
      }
    }
    return false;
  };

  return {
    installationState,
    updateAvailable,
    install,
    applyUpdate,
    shareContent,
  };
};
