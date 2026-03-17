import React from 'react';
import { Loader2, Save, Eye, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type: 'saving' | 'loading' | 'validating' | 'testing' | 'connecting';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  type, 
  size = 'md',
  className,
  message
}) => {
  const getConfig = () => {
    switch (type) {
      case 'saving':
        return {
          icon: Save,
          text: 'Guardando cambios...',
          color: 'text-blue-600',
        };
      case 'loading':
        return {
          icon: Loader2,
          text: 'Cargando...',
          color: 'text-gray-600',
        };
      case 'validating':
        return {
          icon: Eye,
          text: 'Validando flujo...',
          color: 'text-green-600',
        };
      case 'testing':
        return {
          icon: Zap,
          text: 'Ejecutando prueba...',
          color: 'text-orange-600',
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Conectando...',
          color: 'text-purple-600',
        };
      default:
        return {
          icon: Loader2,
          text: 'Procesando...',
          color: 'text-gray-600',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-sm gap-2',
    md: 'text-base gap-3',
    lg: 'text-lg gap-4',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={cn(
      'flex items-center text-muted-foreground',
      sizeClasses[size],
      className
    )}>
      <Icon className={cn(
        'animate-spin',
        iconSizes[size],
        config.color
      )} />
      <span className={config.color}>
        {message || config.text}
      </span>
    </div>
  );
};

// Skeleton para carga de componentes
export const Skeleton: React.FC<{ 
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => (
  <div className={cn(
    'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
    className
  )}>
    {children}
  </div>
);

// Skeleton específico para nodos
export const NodeSkeleton: React.FC = () => (
  <div className="min-w-[200px] max-w-[300px] bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
    <div className="p-3 border-b bg-gray-50 dark:bg-gray-700">
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="h-4 flex-1" />
      </div>
    </div>
    <div className="p-3 space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
);

// Skeleton para panel de propiedades
export const PanelSkeleton: React.FC = () => (
  <div className="w-80 bg-white dark:bg-gray-800 border-l h-full">
    <div className="p-4 border-b">
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  </div>
);

// Loading overlay para toda la aplicación
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
}> = ({ isVisible, message = 'Cargando...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <LoadingState type="loading" size="lg" />
        <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
          {message}
        </p>
      </div>
    </div>
  );
};
