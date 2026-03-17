import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { LoadingState } from '@/components/ui/loading-states';

// Utility para crear lazy components básicos
export const createSimpleLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): LazyExoticComponent<T> => {
  return React.lazy(importFn);
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

// Bundle analyzer helper simplificado
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available in development mode');
    
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
