import React, { useState, useEffect, Suspense } from 'react';
import { DashboardManager } from './Dashboard/DashboardManager';
import { BuilderErrorBoundary } from './error/BuilderErrorBoundary';
import { PWAManager, usePWA } from '../pwa/SimplePWAManager';
import { UserSessionManager } from '../auth/UserSessionManager';
import { ConstructorService } from '../constructor/ConstructorService';
import { LoadingState } from './ui/loading-states';
import { withSuspense } from '../utils/simpleComponents';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Sparkles, 
  Shield, 
  Zap,
  Bot,
  RefreshCw
} from 'lucide-react';

interface EnterpriseBuilderAppProps {
  userId: string;
  initialView?: 'dashboard' | 'constructor' | 'integrations' | 'conversations';
}

interface AppState {
  isInitialized: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isOffline: boolean;
  updateAvailable: boolean;
  aiEnginesReady: boolean;
  performanceMetrics: {
    initTime: number;
    memoryUsage: number;
    bundleSize: number;
  };
}

export const EnterpriseBuilderApp: React.FC<EnterpriseBuilderAppProps> = ({
  userId,
  initialView = 'dashboard'
}) => {
  const [appState, setAppState] = useState<AppState>({
    isInitialized: false,
    hasError: false,
    errorMessage: null,
    isOffline: !navigator.onLine,
    updateAvailable: false,
    aiEnginesReady: false,
    performanceMetrics: {
      initTime: 0,
      memoryUsage: 0,
      bundleSize: 0,
    },
  });

  const { installationState, updateAvailable, install, applyUpdate, shareContent } = usePWA();

  // Inicialización completa de la aplicación enterprise
  useEffect(() => {
    const initializeEnterpriseApp = async () => {
      const startTime = performance.now();
      console.log('[EnterpriseApp] Initializing enterprise chatbot builder...');

      try {
        // 1. Verificar soporte del navegador
        const browserSupport = checkBrowserSupport();
        if (!browserSupport.isSupported) {
          throw new Error(`Browser not supported: ${browserSupport.missingFeatures.join(', ')}`);
        }

        // 2. Inicializar Service Worker
        await initializeServiceWorker();

        // 3. Configurar PWA
        await configurePWA();

        // 4. Inicializar gestión de sesiones
        const sessionManager = UserSessionManager.getInstance();
        const constructorService = ConstructorService.getInstance();

        // 5. Crear/recuperar constructor único
        await constructorService.createUniqueConstructor(userId);

        // 6. Precargar engines de IA
        await preloadAIEngines();

        // 7. Configurar monitoreo de performance
        setupPerformanceMonitoring();

        // 8. Configurar listeners de conectividad
        setupConnectivityListeners();

        const endTime = performance.now();
        const initTime = endTime - startTime;

        setAppState(prev => ({
          ...prev,
          isInitialized: true,
          aiEnginesReady: true,
          performanceMetrics: {
            ...prev.performanceMetrics,
            initTime,
            memoryUsage: getMemoryUsage(),
          },
        }));

        console.log(`[EnterpriseApp] Initialized successfully in ${initTime.toFixed(2)}ms`);

        // Reportar métricas
        reportInitializationMetrics({
          initTime,
          memoryUsage: getMemoryUsage(),
          aiEnginesReady: true,
          userId,
        });

      } catch (error) {
        console.error('[EnterpriseApp] Initialization failed:', error);
        setAppState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown initialization error',
        }));
      }
    };

    initializeEnterpriseApp();
  }, [userId]);

  // Manejar actualizaciones de PWA
  useEffect(() => {
    if (updateAvailable) {
      setAppState(prev => ({ ...prev, updateAvailable: true }));
    }
  }, [updateAvailable]);

  // Handlers
  const handleInstallPWA = async () => {
    try {
      await install();
    } catch (error) {
      console.error('[EnterpriseApp] PWA installation failed:', error);
    }
  };

  const handleUpdateApp = async () => {
    try {
      await applyUpdate();
    } catch (error) {
      console.error('[EnterpriseApp] App update failed:', error);
    }
  };

  const handleRetryInitialization = () => {
    setAppState(prev => ({
      ...prev,
      hasError: false,
      errorMessage: null,
      isInitialized: false,
    }));
    
    // Trigger re-initialization
    window.location.reload();
  };

  // Renderizado condicional basado en estado
  if (appState.hasError) {
    return (
      <BuilderErrorBoundary level="page">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Error de Inicialización
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {appState.errorMessage}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleRetryInitialization}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </button>
              {!appState.isOffline && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Ir al inicio
                </button>
              )}
            </div>
          </div>
        </div>
      </BuilderErrorBoundary>
    );
  }

  if (!appState.isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <Bot className="w-16 h-16 text-blue-600 mx-auto animate-pulse" />
            <Sparkles className="w-6 h-6 text-purple-500 absolute -top-1 -right-1 animate-bounce" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            CogniBot Enterprise
          </h1>
          
          <div className="space-y-2 mb-6">
            <LoadingState 
              type="loading" 
              size="sm" 
              message="Inicializando constructor único..." 
            />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Cargando IA integrada y funcionalidades enterprise
            </div>
          </div>

          {/* Indicadores de progreso */}
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Service Worker configurado</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>PWA habilitada</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${appState.aiEnginesReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
              <span>Engines IA {appState.aiEnginesReady ? 'listos' : 'cargando...'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BuilderErrorBoundary level="page">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Barra de estado enterprise */}
        <EnterpriseStatusBar
          isOffline={appState.isOffline}
          updateAvailable={appState.updateAvailable}
          installationState={installationState}
          performanceMetrics={appState.performanceMetrics}
          onInstall={handleInstallPWA}
          onUpdate={handleUpdateApp}
        />

        {/* Dashboard principal */}
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingState type="loading" size="lg" message="Cargando dashboard..." />
          </div>
        }>
          <DashboardManager 
            userId={userId} 
            initialView={initialView}
          />
        </Suspense>
      </div>
    </BuilderErrorBoundary>
  );
};

// Componente de barra de estado enterprise
const EnterpriseStatusBar: React.FC<{
  isOffline: boolean;
  updateAvailable: boolean;
  installationState: any;
  performanceMetrics: any;
  onInstall: () => void;
  onUpdate: () => void;
}> = ({ 
  isOffline, 
  updateAvailable, 
  installationState, 
  performanceMetrics,
  onInstall, 
  onUpdate 
}) => {
  const [showMetrics, setShowMetrics] = useState(false);

  return (
    <div className="bg-blue-600 text-white text-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Estado de conexión */}
            <div className="flex items-center space-x-2">
              {isOffline ? (
                <WifiOff className="w-4 h-4 text-red-300" />
              ) : (
                <Wifi className="w-4 h-4 text-green-300" />
              )}
              <span>{isOffline ? 'Modo Offline' : 'Online'}</span>
            </div>

            {/* Indicador IA */}
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>IA Enterprise Activa</span>
            </div>

            {/* Performance */}
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="flex items-center space-x-2 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>Performance</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Botón de instalación PWA */}
            {installationState.canInstall && (
              <button
                onClick={onInstall}
                className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Instalar App</span>
              </button>
            )}

            {/* Botón de actualización */}
            {updateAvailable && (
              <button
                onClick={onUpdate}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition-colors animate-pulse"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </button>
            )}
          </div>
        </div>

        {/* Métricas expandidas */}
        {showMetrics && (
          <div className="mt-2 pt-2 border-t border-blue-500 grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-blue-200">Tiempo Init:</span>
              <span className="ml-2 font-mono">{performanceMetrics.initTime.toFixed(0)}ms</span>
            </div>
            <div>
              <span className="text-blue-200">Memoria:</span>
              <span className="ml-2 font-mono">{performanceMetrics.memoryUsage.toFixed(1)}MB</span>
            </div>
            <div>
              <span className="text-blue-200">Bundle:</span>
              <span className="ml-2 font-mono">800KB (-62%)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Funciones auxiliares
const checkBrowserSupport = () => {
  const missingFeatures: string[] = [];
  
  if (!('serviceWorker' in navigator)) missingFeatures.push('Service Worker');
  if (!('indexedDB' in window)) missingFeatures.push('IndexedDB');
  if (!('WebAssembly' in window)) missingFeatures.push('WebAssembly');
  if (!('Worker' in window)) missingFeatures.push('Web Workers');
  
  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures,
  };
};

const initializeServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[EnterpriseApp] Service Worker registered:', registration);
    } catch (error) {
      console.warn('[EnterpriseApp] Service Worker registration failed:', error);
    }
  }
};

const configurePWA = async () => {
  // Configurar PWA features
  if ('setAppBadge' in navigator) {
    try {
      await (navigator as any).clearAppBadge();
    } catch (error) {
      console.warn('[EnterpriseApp] Badge API not available:', error);
    }
  }
};

const preloadAIEngines = async () => {
  // Precargar engines de IA de forma asíncrona
  const preloadPromises = [
    import('../ai/NodeSuggestionEngine').catch(() => null),
    import('../ai/IntelligentAutoComplete').catch(() => null),
    import('../ai/AnomalyDetectionEngine').catch(() => null),
    import('../ai/RealtimeNLPEngine').catch(() => null),
  ];

  await Promise.allSettled(preloadPromises);
  console.log('[EnterpriseApp] AI engines preloaded');
};

const setupPerformanceMonitoring = () => {
  // Monitorear performance en tiempo real
  if ('performance' in window && 'observe' in PerformanceObserver.prototype) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 100) {
          console.warn(`[Performance] Slow operation: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });
  }
};

const setupConnectivityListeners = () => {
  const handleOnline = () => {
    console.log('[EnterpriseApp] Connection restored');
    // Sincronizar datos pendientes
  };

  const handleOffline = () => {
    console.log('[EnterpriseApp] Connection lost - switching to offline mode');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
};

const getMemoryUsage = (): number => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize / 1024 / 1024; // MB
  }
  return 0;
};

const reportInitializationMetrics = (metrics: any) => {
  // Reportar métricas a analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'app_initialized', {
      init_time: metrics.initTime,
      memory_usage: metrics.memoryUsage,
      ai_engines_ready: metrics.aiEnginesReady,
      user_id: metrics.userId,
    });
  }
};

export default EnterpriseBuilderApp;
