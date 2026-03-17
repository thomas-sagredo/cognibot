import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Bot, Home, MessageSquare, PlugZap, LogOut } from 'lucide-react';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    window.location.href = '/login.html';
    return null;
  }

  const isActive = (path: string) => (location.pathname === path ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted');

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 border-r bg-card/95 backdrop-blur-sm p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-gradient-to-br from-cognibot-primary to-cognibot-primary/80 rounded-xl">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="font-bold">CogniBot</div>
        </div>

        <nav className="space-y-2 flex-1">
          <Link to="/" className={`flex items-center gap-2 p-2 rounded ${isActive('/')}`}>
            <Home className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link to="/builder" className={`flex items-center gap-2 p-2 rounded ${isActive('/builder')}`}>
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Constructor</span>
          </Link>
          <Link to="/integrations" className={`flex items-center gap-2 p-2 rounded ${isActive('/integrations')}`}>
            <PlugZap className="w-4 h-4" />
            <span className="text-sm">Integraciones</span>
          </Link>
          <Link to="/conversations" className={`flex items-center gap-2 p-2 rounded ${isActive('/conversations')}`}>
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Conversaciones</span>
          </Link>
        </nav>

        <button
          onClick={() => { logout(); navigate('/login.html'); }}
          className="mt-4 flex items-center gap-2 p-2 text-sm rounded border hover:bg-red-500/10 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-gradient-to-br from-background via-background to-slate-50/50">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;


