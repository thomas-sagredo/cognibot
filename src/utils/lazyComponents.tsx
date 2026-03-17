import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { LoadingState, Skeleton } from '@/components/ui/loading-states';

// Utility para crear lazy components con loading states personalizados
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
  options?: {
    preload?: boolean;
    retryCount?: number;
    timeout?: number;
  }
): LazyExoticComponent<T> => {
  const LazyComponent = React.lazy(() => {
    const { retryCount = 3, timeout = 10000 } = options || {};
    
    return Promise.race([
      importFn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Component load timeout')), timeout)
      )
    ]).catch(async (error) => {
      // Retry logic
      for (let i = 0; i < retryCount; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          return await importFn();
        } catch (retryError) {
          if (i === retryCount - 1) throw retryError;
        }
      }
      throw error;
    });
  });

  // Preload if requested
  if (options?.preload) {
    importFn().catch(() => {
      // Ignore preload errors
    });
  }

  return LazyComponent;
};

// Lazy components del builder con loading states específicos
export const LazyBuilderComponents = {
  // Canvas principal - crítico, preload
  Canvas: createLazyComponent(
    () => import('@/components/builder/BuilderCanvas'),
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <LoadingState type="loading" size="lg" />
    </div>,
    { preload: true }
  ),

  // Sidebar - importante, no preload
  Sidebar: createLazyComponent(
    () => import('@/components/builder/BuilderSidebar'),
    <div className="w-80 bg-white dark:bg-gray-800 border-r">
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  ),

  // Properties panel - bajo demanda
  PropertiesPanel: createLazyComponent(
    () => import('@/components/ImprovedPropertiesPanel'),
    <div className="w-80 bg-white dark:bg-gray-800 border-l">
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  ),

  // Chat simulator - bajo demanda
  ChatSimulator: createLazyComponent(
    () => import('@/components/ChatSimulator'),
    <div className="w-96 bg-white dark:bg-gray-800 border-l flex items-center justify-center">
      <LoadingState type="loading" />
    </div>
  ),

  // Mobile views - bajo demanda
  MobileView: createLazyComponent(
    () => import('@/components/builder/MobileBuilderView'),
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <LoadingState type="loading" />
    </div>
  ),

  TabletView: createLazyComponent(
    () => import('@/components/builder/TabletBuilderView'),
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <LoadingState type="loading" />
    </div>
  ),

  // Node types - muy bajo demanda
  MessageNode: createLazyComponent(
    () => import('@/components/nodes/ImprovedMessageNode'),
    <div className="min-w-[200px] bg-white border rounded-lg p-3">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-3 w-full" />
    </div>
  ),

  OptionNode: createLazyComponent(
    () => import('@/components/nodes/OptionNode'),
    <div className="min-w-[200px] bg-white border rounded-lg p-3">
      <Skeleton className="h-4 w-24 mb-2" />
      <div className="space-y-1">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
  ),

  ActionNode: createLazyComponent(
    () => import('@/components/nodes/ActionNode'),
    <div className="min-w-[200px] bg-white border rounded-lg p-3">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-full" />
    </div>
  ),
};

// HOC para wrappear componentes con Suspense
export const withSuspense = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const SuspenseWrapper = (props: P) => (
    <Suspense fallback={fallback || <LoadingState type="loading" />}>
      <Component {...props} />
    </Suspense>
  );

  SuspenseWrapper.displayName = `withSuspense(${Component.displayName || Component.name})`;
  return SuspenseWrapper;
};

// Hook para preload de componentes
export const usePreloadComponents = () => {
  const preloadComponent = React.useCallback((
    importFn: () => Promise<any>,
    delay = 0
  ) => {
    if (delay > 0) {
      setTimeout(() => {
        importFn().catch(() => {
          // Ignore preload errors
        });
      }, delay);
    } else {
      importFn().catch(() => {
        // Ignore preload errors
      });
    }
  }, []);

  const preloadBuilderComponents = React.useCallback(() => {
    // Preload components based on user interaction patterns
    preloadComponent(() => import('@/components/builder/BuilderSidebar'), 1000);
    preloadComponent(() => import('@/components/ImprovedPropertiesPanel'), 2000);
    preloadComponent(() => import('@/components/ChatSimulator'), 3000);
  }, [preloadComponent]);

  return {
    preloadComponent,
    preloadBuilderComponents,
  };
};

// Route-based code splitting
export const LazyRoutes = {
  Builder: createLazyComponent(
    () => import('@/components/builder/ResponsiveBuilderLayout'),
    <div className="h-screen flex items-center justify-center">
      <LoadingState type="loading" size="lg" />
    </div>,
    { preload: true }
  ),

  Dashboard: createLazyComponent(
    () => import('@/pages/Dashboard'),
    <div className="h-screen flex items-center justify-center">
      <LoadingState type="loading" size="lg" />
    </div>
  ),

  Conversations: createLazyComponent(
    () => import('@/pages/Conversations'),
    <div className="h-screen flex items-center justify-center">
      <LoadingState type="loading" size="lg" />
    </div>
  ),

  Integrations: createLazyComponent(
    () => import('@/pages/Integrations'),
    <div className="h-screen flex items-center justify-center">
      <LoadingState type="loading" size="lg" />
    </div>
  ),
};

// Bundle analyzer helper
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    // Log bundle information without webpack-bundle-analyzer dependency
    console.log('Bundle analysis available in development mode');
    
    // Alternative: Use built-in performance API
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.includes('.js'));
      
      console.log('JavaScript resources loaded:', jsResources.length);
      console.log('Total transfer size:', 
        jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024, 'KB'
      );
    }
  }
};

// Progressive loading strategy
export const useProgressiveLoading = () => {
  const [loadedComponents, setLoadedComponents] = React.useState<Set<string>>(new Set());

  const markAsLoaded = React.useCallback((componentName: string) => {
    setLoadedComponents(prev => new Set([...prev, componentName]));
  }, []);

  const isLoaded = React.useCallback((componentName: string) => {
    return loadedComponents.has(componentName);
  }, [loadedComponents]);

  return {
    markAsLoaded,
    isLoaded,
    loadedCount: loadedComponents.size,
  };
};

// Component for measuring load performance
export const LoadPerformanceMonitor: React.FC<{
  componentName: string;
  children: React.ReactNode;
}> = ({ componentName, children }) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      
      // Report to analytics
      if (loadTime > 1000) {
        console.warn(`Slow component load: ${componentName} took ${loadTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);

  return <>{children}</>;
};
