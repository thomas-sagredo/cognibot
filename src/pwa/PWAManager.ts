import { useState, useEffect } from 'react';

// Progressive Web App Manager
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallationState {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  installPrompt: BeforeInstallPromptEvent | null;
}

interface PWACapabilities {
  serviceWorker: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  periodicSync: boolean;
  webShare: boolean;
  fileHandling: boolean;
  protocolHandling: boolean;
  badging: boolean;
  shortcuts: boolean;
  windowControlsOverlay: boolean;
}

export class PWAManager {
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private updateAvailable = false;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.setupEventListeners();
    this.registerServiceWorker();
    this.setupUpdateHandling();
  }

  // Installation Management
  async getInstallationState(): Promise<PWAInstallationState> {
    const isStandalone = this.isRunningStandalone();
    const platform = this.detectPlatform();
    
    return {
      canInstall: !!this.installPrompt && !isStandalone,
      isInstalled: isStandalone,
      isStandalone,
      platform,
      installPrompt: this.installPrompt,
    };
  }

  async promptInstall(): Promise<{ outcome: string; platform: string } | null> {
    if (!this.installPrompt) {
      throw new Error('Installation prompt not available');
    }

    try {
      await this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      // Track installation attempt
      this.trackEvent('pwa_install_prompt', {
        outcome: result.outcome,
        platform: result.platform,
      });

      if (result.outcome === 'accepted') {
        this.installPrompt = null;
        this.emit('installed');
      }

      return result;
    } catch (error) {
      console.error('Installation prompt failed:', error);
      return null;
    }
  }

  async showIOSInstallInstructions(): Promise<void> {
    const modal = document.createElement('div');
    modal.className = 'pwa-ios-install-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>Instalar CogniBot</h3>
          <div class="install-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-text">
                Toca el botón de compartir 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                </svg>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-text">Selecciona "Añadir a pantalla de inicio"</div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-text">Toca "Añadir" para confirmar</div>
            </div>
          </div>
          <button class="close-button" onclick="this.closest('.pwa-ios-install-modal').remove()">
            Entendido
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .pwa-ios-install-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
      }
      .modal-overlay {
        background: rgba(0, 0, 0, 0.5);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .modal-content {
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 320px;
        width: 100%;
      }
      .install-steps {
        margin: 20px 0;
      }
      .step {
        display: flex;
        align-items: center;
        margin: 16px 0;
      }
      .step-number {
        width: 24px;
        height: 24px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        margin-right: 12px;
      }
      .step-text {
        flex: 1;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .close-button {
        width: 100%;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 8px;
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);
  }

  // Capabilities Detection
  async getCapabilities(): Promise<PWACapabilities> {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window && 'Notification' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      periodicSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
      webShare: 'share' in navigator,
      fileHandling: 'launchQueue' in window,
      protocolHandling: 'registerProtocolHandler' in navigator,
      badging: 'setAppBadge' in navigator,
      shortcuts: 'getInstalledRelatedApps' in navigator,
      windowControlsOverlay: 'windowControlsOverlay' in navigator,
    };
  }

  // Push Notifications
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    
    this.trackEvent('notification_permission', {
      permission,
      timestamp: Date.now(),
    });

    return permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        ),
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      this.trackEvent('push_subscription_created');
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  // App Badge API
  async setBadge(count?: number): Promise<void> {
    if ('setAppBadge' in navigator) {
      try {
        await (navigator as any).setAppBadge(count);
      } catch (error) {
        console.warn('Badge API failed:', error);
      }
    }
  }

  async clearBadge(): Promise<void> {
    if ('clearAppBadge' in navigator) {
      try {
        await (navigator as any).clearAppBadge();
      } catch (error) {
        console.warn('Clear badge failed:', error);
      }
    }
  }

  // Web Share API
  async shareContent(data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    if (!('share' in navigator)) {
      // Fallback to clipboard or other sharing methods
      return this.fallbackShare(data);
    }

    try {
      await navigator.share(data);
      this.trackEvent('content_shared', { method: 'web_share' });
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Web Share failed:', error);
      }
      return false;
    }
  }

  // File Handling
  setupFileHandling(): void {
    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer((launchParams: any) => {
        if (launchParams.files && launchParams.files.length) {
          this.handleFiles(launchParams.files);
        }
      });
    }
  }

  // Protocol Handling
  registerProtocolHandler(): void {
    if ('registerProtocolHandler' in navigator) {
      try {
        navigator.registerProtocolHandler(
          'web+cognibot',
          '/handle?url=%s',
          'CogniBot'
        );
      } catch (error) {
        console.warn('Protocol handler registration failed:', error);
      }
    }
  }

  // Update Management
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return this.updateAvailable;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  }

  async applyUpdate(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      throw new Error('No update available');
    }

    // Tell the waiting service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload the page to activate the new service worker
    window.location.reload();
  }

  // Private Methods
  private setupEventListeners(): void {
    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as BeforeInstallPromptEvent;
      this.emit('installable');
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.emit('installed');
      this.trackEvent('pwa_installed');
    });

    // Visibility change (for background sync)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.emit('app_focused');
      } else {
        this.emit('app_backgrounded');
      }
    });

    // Online/offline status
    window.addEventListener('online', () => this.emit('online'));
    window.addEventListener('offline', () => this.emit('offline'));
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', this.registration);
      this.emit('sw_registered');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private setupUpdateHandling(): void {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.updateAvailable = true;
            this.emit('update_available');
          }
        });
      }
    });
  }

  private isRunningStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  private detectPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else if (/windows|mac|linux/.test(userAgent)) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async fallbackShare(data: {
    title?: string;
    text?: string;
    url?: string;
  }): Promise<boolean> {
    const shareText = `${data.title || ''}\n${data.text || ''}\n${data.url || ''}`.trim();
    
    try {
      await navigator.clipboard.writeText(shareText);
      this.emit('content_copied');
      this.trackEvent('content_shared', { method: 'clipboard' });
      return true;
    } catch (error) {
      console.error('Clipboard fallback failed:', error);
      return false;
    }
  }

  private async handleFiles(files: FileSystemFileHandle[]): Promise<void> {
    for (const fileHandle of files) {
      try {
        const file = await fileHandle.getFile();
        
        if (file.name.endsWith('.json') || file.name.endsWith('.bot')) {
          const content = await file.text();
          this.emit('file_opened', { file, content });
        }
      } catch (error) {
        console.error('File handling failed:', error);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  private trackEvent(event: string, data?: any): void {
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, data);
    }
  }

  // Public Event API
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// React Hook for PWA functionality
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
      const state = await pwaManager.getInstallationState();
      setInstallationState(state);
    };

    updateInstallationState();

    // Event listeners
    pwaManager.on('installable', updateInstallationState);
    pwaManager.on('installed', updateInstallationState);
    pwaManager.on('update_available', () => setUpdateAvailable(true));

    return () => {
      pwaManager.off('installable', updateInstallationState);
      pwaManager.off('installed', updateInstallationState);
    };
  }, [pwaManager]);

  const install = useCallback(async () => {
    if (installationState.platform === 'ios') {
      await pwaManager.showIOSInstallInstructions();
    } else {
      return pwaManager.promptInstall();
    }
  }, [pwaManager, installationState.platform]);

  const applyUpdate = useCallback(() => {
    return pwaManager.applyUpdate();
  }, [pwaManager]);

  const shareContent = useCallback((data: any) => {
    return pwaManager.shareContent(data);
  }, [pwaManager]);

  return {
    installationState,
    updateAvailable,
    install,
    applyUpdate,
    shareContent,
    pwaManager,
  };
};
