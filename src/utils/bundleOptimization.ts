// Utilidades para optimización de bundle

// Tree-shaking optimizado para Lucide icons
export const optimizedIcons = {
  // En lugar de importar todo lucide-react, importar iconos específicos
  // import { Save, Edit, Delete } from 'lucide-react'; // ❌ Malo
  // import Save from 'lucide-react/dist/esm/icons/save'; // ✅ Mejor
  
  // Función helper para importar iconos dinámicamente
  loadIcon: async (iconName: string) => {
    try {
      const icon = await import(`lucide-react/dist/esm/icons/${iconName.toLowerCase()}`);
      return icon.default;
    } catch (error) {
      console.warn(`Icon ${iconName} not found`);
      return null;
    }
  },
};

// Optimización de imports de lodash
export const optimizedLodash = {
  // En lugar de import _ from 'lodash'; // ❌ Malo (540KB)
  // Usar imports específicos: import debounce from 'lodash/debounce'; // ✅ Mejor
  
  debounce: async () => (await import('lodash/debounce')).default,
  throttle: async () => (await import('lodash/throttle')).default,
  cloneDeep: async () => (await import('lodash/cloneDeep')).default,
  isEqual: async () => (await import('lodash/isEqual')).default,
};

// Análisis de dependencias en runtime
export const analyzeDependencies = () => {
  if (process.env.NODE_ENV === 'development') {
    // Analizar qué módulos están siendo cargados
    const loadedModules = new Set<string>();
    
    const originalRequire = window.require;
    if (originalRequire) {
      window.require = function(id: string) {
        loadedModules.add(id);
        return originalRequire(id);
      };
    }

    // Log de módulos cargados después de 5 segundos
    setTimeout(() => {
      console.group('📦 Loaded Modules Analysis');
      console.log('Total modules loaded:', loadedModules.size);
      console.log('Modules:', Array.from(loadedModules).sort());
      console.groupEnd();
    }, 5000);
  }
};

// Optimización de React Query
export const optimizedQueryClient = {
  // Configuración optimizada para reducir bundle size
  createOptimizedClient: async () => {
    const { QueryClient } = await import('@tanstack/react-query');
    
    return new QueryClient({
      defaultOptions: {
        queries: {
          // Reducir tiempo de cache para liberar memoria
          staleTime: 5 * 60 * 1000, // 5 minutos
          cacheTime: 10 * 60 * 1000, // 10 minutos
          // Desactivar refetch automático para reducir requests
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
    });
  },
};

// Lazy loading de componentes pesados con preload inteligente
export const createSmartLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preloadCondition?: () => boolean
) => {
  const LazyComponent = React.lazy(importFn);
  
  // Preload inteligente basado en condiciones
  if (preloadCondition?.()) {
    importFn().catch(() => {
      // Ignore preload errors
    });
  }
  
  return LazyComponent;
};

// Optimización de CSS
export const optimizedStyles = {
  // Cargar CSS crítico inline y diferir el resto
  loadCriticalCSS: () => {
    const criticalCSS = `
      /* CSS crítico para above-the-fold */
      .builder-loading { opacity: 0.5; }
      .builder-error { color: red; }
    `;
    
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  },
  
  // Cargar CSS no crítico de forma diferida
  loadDeferredCSS: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
    };
    document.head.appendChild(link);
  },
};

// Monitoreo de performance del bundle
export const bundlePerformanceMonitor = {
  // Medir tiempo de carga de chunks
  measureChunkLoadTime: (chunkName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`📊 Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms`);
      
      // Reportar si es muy lento
      if (loadTime > 1000) {
        console.warn(`⚠️ Slow chunk load: ${chunkName} took ${loadTime.toFixed(2)}ms`);
      }
      
      return loadTime;
    };
  },
  
  // Analizar memoria usada
  analyzeMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.group('🧠 Memory Usage');
      console.log('Used:', (memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
      console.log('Total:', (memory.totalJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
      console.log('Limit:', (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2), 'MB');
      console.groupEnd();
    }
  },
};

// Optimización de imágenes
export const imageOptimization = {
  // Lazy loading de imágenes con intersection observer
  setupLazyImages: () => {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  },
  
  // Generar srcset para responsive images
  generateSrcSet: (baseUrl: string, sizes: number[]) => {
    return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
  },
};

// Configuración de Vite optimizada
export const viteOptimizedConfig = {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'reactflow-vendor': ['@xyflow/react'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'utils-vendor': ['lodash-es', 'date-fns'],
          
          // Separar por features
          'builder-core': [
            './src/components/builder/BuilderCanvas',
            './src/components/builder/BuilderSidebar',
          ],
          'builder-mobile': [
            './src/components/builder/MobileBuilderView',
            './src/components/builder/TabletBuilderView',
          ],
          'nodes': [
            './src/components/nodes/BaseNode',
            './src/components/nodes/ImprovedMessageNode',
          ],
        },
      },
    },
    
    // Optimizaciones adicionales
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.log en producción
        drop_debugger: true,
      },
    },
    
    // Configurar límites de chunk
    chunkSizeWarningLimit: 1000,
  },
  
  // Optimizar dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@xyflow/react',
    ],
    exclude: [
      // Excluir dependencias que deben ser lazy loaded
      'monaco-editor',
    ],
  },
};

// Utilidad para medir el tamaño del bundle
export const measureBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    // Estimar tamaño del bundle basado en módulos cargados
    let totalSize = 0;
    const modules = Object.keys(window.require?.cache || {});
    
    modules.forEach((module) => {
      // Estimación aproximada basada en el nombre del módulo
      totalSize += module.length * 100; // Estimación muy básica
    });
    
    console.log(`📦 Estimated bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
  }
};

// Auto-análisis en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Ejecutar análisis después de que la app se cargue
  setTimeout(() => {
    analyzeDependencies();
    bundlePerformanceMonitor.analyzeMemoryUsage();
    measureBundleSize();
  }, 3000);
}
