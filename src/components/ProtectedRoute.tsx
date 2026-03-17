import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token || !user) {
      window.location.href = '/login.html';
    }
  }, [token, user]);

  // Mientras redirige, no mostrar nada
  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
