import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'feature';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class BuilderErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    this.logError(error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'component',
    };

    // Send to monitoring service (Sentry, LogRocket, etc.)
    console.error('Builder Error:', errorData);
    
    // You can integrate with error tracking services here
    // Sentry.captureException(error, { extra: errorData });
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private renderErrorDetails = () => {
    const { error, errorInfo } = this.state;
    
    if (!error) return null;

    return (
      <details className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
          Detalles técnicos
        </summary>
        <div className="mt-2 space-y-2 text-xs font-mono">
          <div>
            <strong>Error:</strong> {error.message}
          </div>
          {error.stack && (
            <div>
              <strong>Stack:</strong>
              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                {error.stack}
              </pre>
            </div>
          )}
          {errorInfo?.componentStack && (
            <div>
              <strong>Component Stack:</strong>
              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-red-800 dark:text-red-200">
                {level === 'page' ? 'Error en la página' : 
                 level === 'feature' ? 'Error en la funcionalidad' : 
                 'Error en el componente'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600 dark:text-gray-400">
                {level === 'page' 
                  ? 'Ha ocurrido un error inesperado en la página. Por favor, recarga o vuelve al inicio.'
                  : 'Ha ocurrido un error inesperado. Puedes intentar de nuevo o recargar la página.'
                }
              </p>

              <div className="flex flex-col gap-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Intentar de nuevo ({this.maxRetries - this.retryCount} intentos restantes)
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReload}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recargar página
                </Button>

                {level === 'page' && (
                  <Button 
                    onClick={this.handleGoHome}
                    className="w-full"
                    variant="ghost"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Ir al inicio
                  </Button>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && this.renderErrorDetails()}

              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID del error: {this.state.errorId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para manejo de errores asíncronos
export const useAsyncError = () => {
  const [, setError] = React.useState();
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
};

// Componente para errores específicos del builder
export const BuilderErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => (
  <div className="flex flex-col items-center justify-center h-64 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
    <Bug className="w-8 h-8 text-red-600 dark:text-red-400 mb-4" />
    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
      Error en el Constructor
    </h3>
    <p className="text-sm text-red-600 dark:text-red-400 text-center mb-4">
      {error.message || 'Ha ocurrido un error inesperado en el constructor de chatbots.'}
    </p>
    <Button onClick={resetError} size="sm" variant="outline">
      <RefreshCw className="w-4 h-4 mr-2" />
      Reintentar
    </Button>
  </div>
);

// HOC para wrappear componentes con error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <BuilderErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </BuilderErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook para reportar errores manualmente
export const useErrorReporting = () => {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Manual Error Report:', errorData);
    
    // Send to monitoring service
    // Sentry.captureException(error, { extra: errorData });
  }, []);

  return { reportError };
};
