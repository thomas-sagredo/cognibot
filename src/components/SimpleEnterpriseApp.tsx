import { useState } from 'react';
import { EnterpriseDashboard } from '@/components/enterprise/EnterpriseDashboard';
import { ChatbotBuilder } from '@/components/enterprise/ChatbotBuilder';
import { Integrations } from '@/components/enterprise/Integrations';
import { Conversations } from '@/components/enterprise/Conversations';
import { Bot, BarChart3, Moon, Sun, Zap, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SimpleEnterpriseApp = () => {
  const [currentView, setCurrentView] = useState(initialView);
  const [isLoading, setIsLoading] = useState(true);
  const [constructorId, setConstructorId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing Simple Enterprise App...');
        
        // Simular inicialización sin dependencias problemáticas
        setTimeout(() => {
          setConstructorId(`constructor_${userId}_${Date.now()}`);
          setIsInitialized(true);
          setIsLoading(false);
          console.log('✅ Simple Enterprise App initialized');
        }, 1000);

      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState type="loading" message="Inicializando CogniBot Enterprise..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Bot className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                CogniBot Enterprise
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Wifi className="w-4 h-4 text-green-500" />
                <span>Online</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>IA Activa</span>
              </div>

              {/* Toggle modo oscuro */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentView('constructor')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'constructor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Constructor</span>
            </button>

            <button
              onClick={() => setCurrentView('integrations')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'integrations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Integraciones</span>
            </button>

            <button
              onClick={() => setCurrentView('conversations')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'conversations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Conversaciones</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Constructor Único</p>
                    <p className="text-3xl font-bold">{constructorId ? '1' : '0'}</p>
                    <p className="text-blue-100 text-xs">Activo ahora</p>
                  </div>
                  <Bot className="w-12 h-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">IA Engines</p>
                    <p className="text-3xl font-bold">8</p>
                    <p className="text-green-100 text-xs">Operativos</p>
                  </div>
                  <Sparkles className="w-12 h-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Conversaciones</p>
                    <p className="text-3xl font-bold">1,247</p>
                    <p className="text-purple-100 text-xs">Este mes</p>
                  </div>
                  <MessageSquare className="w-12 h-12 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Uptime</p>
                    <p className="text-3xl font-bold">99.9%</p>
                    <p className="text-orange-100 text-xs">Últimos 30 días</p>
                  </div>
                  <Zap className="w-12 h-12 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de conversaciones */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📈 Conversaciones por Día</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {[45, 52, 38, 67, 73, 56, 89, 94, 67, 78, 85, 92, 67, 89].map((height, index) => (
                    <div key={index} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg relative group">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {Math.floor(height * 2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>Hace 14 días</span>
                  <span>Hoy</span>
                </div>
              </div>

              {/* Gráfico circular de integraciones */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🔗 Uso por Integración</h3>
                <div className="flex items-center justify-center h-64">
                  <div className="relative w-48 h-48">
                    {/* Círculo base */}
                    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                      {/* WhatsApp - 60% */}
                      <circle
                        cx="50" cy="50" r="40"
                        stroke="#10B981" strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="150.8 251.2"
                        strokeDashoffset="0"
                        className="transition-all duration-1000"
                      />
                      {/* Telegram - 25% */}
                      <circle
                        cx="50" cy="50" r="40"
                        stroke="#3B82F6" strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="62.8 339.2"
                        strokeDashoffset="-150.8"
                        className="transition-all duration-1000"
                      />
                      {/* WebChat - 15% */}
                      <circle
                        cx="50" cy="50" r="40"
                        stroke="#8B5CF6" strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="37.7 364.3"
                        strokeDashoffset="-213.6"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">1,247</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">WhatsApp</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">748 (60%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Telegram</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">312 (25%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">WebChat</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">187 (15%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de sesión mejorada */}
            {isInitialized && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">🔐 Información de Sesión</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 dark:text-green-400 font-medium text-sm">Activa</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Usuario</div>
                    <div className="font-bold text-gray-900 dark:text-white">{userId}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Constructor ID</div>
                    <div className="font-mono text-xs text-gray-900 dark:text-white">{constructorId}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estado</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 dark:text-green-400 font-medium">Operativo</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'constructor' && (
          <div className="fixed inset-0 top-16 bg-white dark:bg-gray-900 z-50">
            <BuilderErrorBoundary level="component">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <LoadingState type="loading" message="Cargando tu constructor completo..." />
                </div>
              }>
                {/* Constructor mejorado con lo mejor de Lovable */}
                <LovableChatbotBuilder />
              </Suspense>
            </BuilderErrorBoundary>
          </div>
        )}

        {currentView === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">⚙️ Integraciones</h2>
                  <p className="text-gray-600 dark:text-gray-400">Conecta tu chatbot con diferentes plataformas</p>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 dark:text-green-400 font-medium">3 integraciones disponibles</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* WhatsApp */}
                <div className="group relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">WhatsApp Business</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    Conecta con WhatsApp Business API para alcanzar a millones de usuarios
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      Disponible
                    </span>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
                      Configurar
                    </button>
                  </div>
                </div>

                {/* Telegram */}
                <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Telegram Bot</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    Crea un bot de Telegram con todas las funcionalidades de tu constructor
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      Disponible
                    </span>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                      Configurar
                    </button>
                  </div>
                </div>

                {/* WebChat */}
                <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">WebChat</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    Widget de chat para integrar directamente en tu sitio web
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                      Disponible
                    </span>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
                      Configurar
                    </button>
                  </div>
                </div>
              </div>

              {/* Estadísticas de integraciones */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">3</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Integraciones disponibles</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Configuradas</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">∞</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Usuarios potenciales</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'conversations' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">💬 Conversaciones</h2>
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin conversaciones</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Las conversaciones aparecerán aquí cuando se configuren las integraciones
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SimpleEnterpriseApp;
