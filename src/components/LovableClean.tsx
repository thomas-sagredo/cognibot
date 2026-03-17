import { useState, useEffect } from 'react';
import { Bot, BarChart3, Moon, Sun, Zap, MessageSquare, Settings, LogOut, User } from 'lucide-react';
import { ChatbotFlowBuilder } from './ChatbotFlowBuilder';
import { InboxPanel } from './InboxPanel';
import { useAuth } from '@/hooks/useAuth';

// ── Sub-páginas ───────────────────────────────────────────────────────────────
const SimpleDashboard = () => (
  <div className="p-8 dark:bg-gray-900 min-h-full">
    <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
      Dashboard Enterprise
    </h1>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
        <h3 className="text-sm opacity-80">Conversaciones</h3>
        <p className="text-3xl font-bold">2,847</p>
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
        <h3 className="text-sm opacity-80">Usuarios Activos</h3>
        <p className="text-3xl font-bold">1,254</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700">
        <h3 className="text-sm text-gray-600 dark:text-gray-400">Tiempo Promedio</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">2.3 min</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700">
        <h3 className="text-sm text-gray-600 dark:text-gray-400">Satisfacción</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">95.8%</p>
      </div>
    </div>
  </div>
);

const SimpleBuilder = () => (
  <div className="p-0 h-full">
    <ChatbotFlowBuilder />
  </div>
);


const SimpleIntegrations = () => (
  <div className="p-8 dark:bg-gray-900 min-h-full">
    <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
      Integraciones
    </h1>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border dark:border-gray-700 min-h-[500px] flex items-center justify-center">
      <div className="text-center">
        <Settings className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 dark:text-white">Conecta tu Bot</h2>
        <p className="text-gray-600 dark:text-gray-400">WhatsApp, Telegram, Facebook y más</p>
      </div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
const LovableClean = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'builder' | 'conversations' | 'integrations'>('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    // Leer la preferencia guardada al cargar
    return localStorage.getItem('cognibot-dark') === 'true';
  });
  const { user, logout } = useAuth();

  // Aplicar la clase 'dark' al <html> cuando cambia darkMode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('cognibot-dark', String(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login.html';
  };

  const navItems = [
    { id: 'dashboard' as const, icon: BarChart3, label: 'Dashboard' },
    { id: 'builder' as const, icon: Zap, label: 'Constructor' },
    { id: 'conversations' as const, icon: MessageSquare, label: 'Conversaciones' },
    { id: 'integrations' as const, icon: Settings, label: 'Integraciones' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm z-50 transition-colors duration-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-2">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                CogniBot Enterprise
              </h1>
            </div>

            {/* Acciones del header */}
            <div className="flex items-center space-x-3">
              {/* Info del usuario */}
              {user && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.nombre}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full font-medium capitalize">
                    {user.plan}
                  </span>
                </div>
              )}

              {/* Toggle modo oscuro */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              >
                {darkMode
                  ? <Sun className="w-5 h-5 text-yellow-400" />
                  : <Moon className="w-5 h-5" />
                }
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav className="flex-shrink-0 border-b bg-white dark:bg-gray-900 dark:border-gray-800 transition-colors duration-200">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all ${currentView === id
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                {currentView === id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
                )}
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden h-full">
        {currentView === 'dashboard' && <SimpleDashboard />}
        {currentView === 'builder' && <SimpleBuilder />}
        {currentView === 'conversations' && <InboxPanel />}
        {currentView === 'integrations' && <SimpleIntegrations />}
      </main>
    </div>
  );
};

export default LovableClean;
