import { useState } from 'react';
import { EnterpriseDashboard } from './enterprise/EnterpriseDashboard';
import { ChatbotBuilder } from './enterprise/ChatbotBuilder';
import { Integrations } from './enterprise/Integrations';
import { Conversations } from './enterprise/Conversations';
import { Bot, BarChart3, Moon, Sun, Zap, MessageSquare, Settings } from 'lucide-react';
import { Button } from './ui/button';

const LovableInterface = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'builder' | 'conversations' | 'integrations'>('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="gradient-primary rounded-xl p-2">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CogniBot Enterprise
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Online</span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all relative ${
                currentView === 'dashboard'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {currentView === 'dashboard' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />
              )}
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentView('builder')}
              className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all relative ${
                currentView === 'builder'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {currentView === 'builder' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />
              )}
              <Zap className="w-4 h-4" />
              <span>Constructor</span>
            </button>

            <button
              onClick={() => setCurrentView('conversations')}
              className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all relative ${
                currentView === 'conversations'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {currentView === 'conversations' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />
              )}
              <MessageSquare className="w-4 h-4" />
              <span>Conversaciones</span>
            </button>

            <button
              onClick={() => setCurrentView('integrations')}
              className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-all relative ${
                currentView === 'integrations'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {currentView === 'integrations' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />
              )}
              <Settings className="w-4 h-4" />
              <span>Integraciones</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {currentView === 'dashboard' && <EnterpriseDashboard />}
        {currentView === 'builder' && <ChatbotBuilder />}
        {currentView === 'conversations' && <Conversations />}
        {currentView === 'integrations' && <Integrations />}
      </main>
    </div>
  );
};

export default LovableInterface;
