// Advanced Service Worker with strategic caching
const CACHE_VERSION = 'v2.1.0';
const STATIC_CACHE = `cognibot-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `cognibot-dynamic-${CACHE_VERSION}`;
const API_CACHE = `cognibot-api-${CACHE_VERSION}`;
const IMAGES_CACHE = `cognibot-images-${CACHE_VERSION}`;

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// API endpoints with different cache strategies
const API_ROUTES = {
  '/api/chatbots': { strategy: CACHE_STRATEGIES.NETWORK_FIRST, ttl: 300000 }, // 5 min
  '/api/nodes': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, ttl: 600000 }, // 10 min
  '/api/templates': { strategy: CACHE_STRATEGIES.CACHE_FIRST, ttl: 3600000 }, // 1 hour
  '/api/user': { strategy: CACHE_STRATEGIES.NETWORK_FIRST, ttl: 60000 }, // 1 min
  '/api/analytics': { strategy: CACHE_STRATEGIES.NETWORK_ONLY, ttl: 0 }
};

// Background sync queues
const SYNC_QUEUES = {
  CHATBOT_SAVES: 'chatbot-saves',
  ANALYTICS: 'analytics-events',
  USER_ACTIONS: 'user-actions'
};

class AdvancedServiceWorker {
  constructor() {
    this.setupEventListeners();
    this.initializeIndexedDB();
  }

  setupEventListeners() {
    self.addEventListener('install', this.handleInstall.bind(this));
    self.addEventListener('activate', this.handleActivate.bind(this));
    self.addEventListener('fetch', this.handleFetch.bind(this));
    self.addEventListener('sync', this.handleBackgroundSync.bind(this));
    self.addEventListener('push', this.handlePushNotification.bind(this));
    self.addEventListener('notificationclick', this.handleNotificationClick.bind(this));
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  async handleInstall(event) {
    console.log('[SW] Installing service worker');
    
    event.waitUntil(
      Promise.all([
        this.cacheStaticAssets(),
        this.preloadCriticalData(),
        self.skipWaiting()
      ])
    );
  }

  async handleActivate(event) {
    console.log('[SW] Activating service worker');
    
    event.waitUntil(
      Promise.all([
        this.cleanupOldCaches(),
        this.setupPeriodicSync(),
        self.clients.claim()
      ])
    );
  }

  async handleFetch(event) {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests for caching
    if (request.method !== 'GET') {
      if (request.method === 'POST' || request.method === 'PUT') {
        return this.handleMutationRequest(event);
      }
      return;
    }

    // Route to appropriate handler
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(this.handleAPIRequest(request));
    } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
      event.respondWith(this.handleImageRequest(request));
    } else if (url.pathname.startsWith('/static/')) {
      event.respondWith(this.handleStaticRequest(request));
    } else {
      event.respondWith(this.handleNavigationRequest(request));
    }
  }

  async handleAPIRequest(request) {
    const url = new URL(request.url);
    const route = this.findMatchingRoute(url.pathname);
    
    if (!route) {
      return this.networkFirst(request, API_CACHE);
    }

    switch (route.strategy) {
      case CACHE_STRATEGIES.CACHE_FIRST:
        return this.cacheFirst(request, API_CACHE, route.ttl);
      case CACHE_STRATEGIES.NETWORK_FIRST:
        return this.networkFirst(request, API_CACHE, route.ttl);
      case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        return this.staleWhileRevalidate(request, API_CACHE, route.ttl);
      case CACHE_STRATEGIES.NETWORK_ONLY:
        return this.networkOnly(request);
      default:
        return this.networkFirst(request, API_CACHE);
    }
  }

  async handleImageRequest(request) {
    return this.cacheFirst(request, IMAGES_CACHE, 86400000); // 24 hours
  }

  async handleStaticRequest(request) {
    return this.cacheFirst(request, STATIC_CACHE);
  }

  async handleNavigationRequest(request) {
    try {
      // Try network first for navigation
      const response = await fetch(request);
      
      // Cache successful navigation responses
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
      
      return response;
    } catch (error) {
      // Fallback to cached version or offline page
      const cache = await caches.open(DYNAMIC_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline page for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
      
      throw error;
    }
  }

  async handleMutationRequest(event) {
    const { request } = event;
    
    try {
      // Try to send the request
      const response = await fetch(request.clone());
      
      if (response.ok) {
        // Success - clear related caches
        await this.invalidateRelatedCaches(request);
        return response;
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      // Network failed - queue for background sync
      await this.queueForBackgroundSync(request);
      
      // Return optimistic response
      return new Response(
        JSON.stringify({ 
          success: true, 
          queued: true, 
          message: 'Request queued for when connection is restored' 
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  async handleBackgroundSync(event) {
    console.log('[SW] Background sync triggered:', event.tag);
    
    switch (event.tag) {
      case SYNC_QUEUES.CHATBOT_SAVES:
        event.waitUntil(this.processChatbotSaves());
        break;
      case SYNC_QUEUES.ANALYTICS:
        event.waitUntil(this.processAnalyticsEvents());
        break;
      case SYNC_QUEUES.USER_ACTIONS:
        event.waitUntil(this.processUserActions());
        break;
    }
  }

  async handlePushNotification(event) {
    const data = event.data ? event.data.json() : {};
    
    const options = {
      body: data.body || 'New update available',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'general',
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icons/open-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-icon.png'
        }
      ],
      requireInteraction: data.requireInteraction || false
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'CogniBot', options)
    );
  }

  async handleNotificationClick(event) {
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data;
    
    if (action === 'dismiss') {
      return;
    }
    
    // Open or focus the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if (data.url) {
              client.postMessage({ type: 'navigate', url: data.url });
            }
            return;
          }
        }
        
        // Open new window
        const url = data.url || '/';
        return self.clients.openWindow(url);
      })
    );
  }

  async handleMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_CACHE_STATUS':
        event.ports[0].postMessage(await this.getCacheStatus());
        break;
      case 'CLEAR_CACHE':
        await this.clearAllCaches();
        event.ports[0].postMessage({ success: true });
        break;
      case 'PRELOAD_ROUTE':
        await this.preloadRoute(data.route);
        event.ports[0].postMessage({ success: true });
        break;
    }
  }

  // Cache strategies implementation
  async cacheFirst(request, cacheName, ttl) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still valid
      if (ttl && this.isCacheExpired(cachedResponse, ttl)) {
        // Update cache in background
        this.updateCacheInBackground(request, cache);
      }
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // Return offline fallback if available
      return this.getOfflineFallback(request);
    }
  }

  async networkFirst(request, cacheName, ttl) {
    try {
      const response = await fetch(request);
      
      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      
      return response;
    } catch (error) {
      // Network failed, try cache
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse && (!ttl || !this.isCacheExpired(cachedResponse, ttl))) {
        return cachedResponse;
      }
      
      return this.getOfflineFallback(request);
    }
  }

  async staleWhileRevalidate(request, cacheName, ttl) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Always try to update from network
    const networkPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);
    
    // Return cached version immediately if available
    if (cachedResponse && (!ttl || !this.isCacheExpired(cachedResponse, ttl))) {
      return cachedResponse;
    }
    
    // Wait for network if no cache or expired
    return networkPromise || this.getOfflineFallback(request);
  }

  async networkOnly(request) {
    return fetch(request);
  }

  // Helper methods
  async cacheStaticAssets() {
    const cache = await caches.open(STATIC_CACHE);
    return cache.addAll(STATIC_ASSETS);
  }

  async preloadCriticalData() {
    // Preload critical API endpoints
    const criticalEndpoints = [
      '/api/user/profile',
      '/api/chatbots?limit=5',
      '/api/templates?featured=true'
    ];
    
    const cache = await caches.open(API_CACHE);
    
    return Promise.allSettled(
      criticalEndpoints.map(async endpoint => {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            cache.put(endpoint, response);
          }
        } catch (error) {
          console.warn(`Failed to preload ${endpoint}:`, error);
        }
      })
    );
  }

  async cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGES_CACHE];
    
    return Promise.all(
      cacheNames.map(cacheName => {
        if (!currentCaches.includes(cacheName)) {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );
  }

  async setupPeriodicSync() {
    // Setup periodic background sync for data updates
    if ('periodicSync' in self.registration) {
      try {
        await self.registration.periodicSync.register('update-cache', {
          minInterval: 24 * 60 * 60 * 1000 // 24 hours
        });
      } catch (error) {
        console.log('Periodic sync not supported:', error);
      }
    }
  }

  findMatchingRoute(pathname) {
    for (const [route, config] of Object.entries(API_ROUTES)) {
      if (pathname.startsWith(route)) {
        return config;
      }
    }
    return null;
  }

  isCacheExpired(response, ttl) {
    const cachedTime = response.headers.get('sw-cached-time');
    if (!cachedTime) return false;
    
    return Date.now() - parseInt(cachedTime) > ttl;
  }

  async updateCacheInBackground(request, cache) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        // Add timestamp header
        const responseWithTimestamp = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...response.headers,
            'sw-cached-time': Date.now().toString()
          }
        });
        cache.put(request, responseWithTimestamp);
      }
    } catch (error) {
      console.warn('Background cache update failed:', error);
    }
  }

  async getOfflineFallback(request) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
      // Return cached data or offline message for API requests
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'This data is not available offline' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return offline page for navigation
    return caches.match('/offline.html');
  }

  async queueForBackgroundSync(request) {
    const db = await this.getIndexedDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now(),
      queue: this.determineQueue(request)
    };
    
    await store.add(requestData);
    
    // Register for background sync
    await self.registration.sync.register(requestData.queue);
  }

  determineQueue(request) {
    const url = new URL(request.url);
    
    if (url.pathname.includes('/chatbots')) {
      return SYNC_QUEUES.CHATBOT_SAVES;
    } else if (url.pathname.includes('/analytics')) {
      return SYNC_QUEUES.ANALYTICS;
    } else {
      return SYNC_QUEUES.USER_ACTIONS;
    }
  }

  async processChatbotSaves() {
    const db = await this.getIndexedDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const index = store.index('queue');
    
    const requests = await index.getAll(SYNC_QUEUES.CHATBOT_SAVES);
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          // Success - remove from queue
          await store.delete(requestData.id);
          
          // Notify clients
          this.notifyClients({
            type: 'SYNC_SUCCESS',
            data: { url: requestData.url, timestamp: requestData.timestamp }
          });
        }
      } catch (error) {
        console.error('Failed to sync chatbot save:', error);
        // Keep in queue for retry
      }
    }
  }

  async processAnalyticsEvents() {
    // Similar to processChatbotSaves but for analytics
    const db = await this.getIndexedDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const index = store.index('queue');
    
    const requests = await index.getAll(SYNC_QUEUES.ANALYTICS);
    
    // Batch analytics events for efficiency
    const events = requests.map(req => JSON.parse(req.body));
    
    if (events.length > 0) {
      try {
        const response = await fetch('/api/analytics/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events })
        });
        
        if (response.ok) {
          // Remove all processed events
          for (const request of requests) {
            await store.delete(request.id);
          }
        }
      } catch (error) {
        console.error('Failed to sync analytics:', error);
      }
    }
  }

  async processUserActions() {
    // Process other user actions
    const db = await this.getIndexedDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const index = store.index('queue');
    
    const requests = await index.getAll(SYNC_QUEUES.USER_ACTIONS);
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          await store.delete(requestData.id);
        }
      } catch (error) {
        console.error('Failed to sync user action:', error);
      }
    }
  }

  async invalidateRelatedCaches(request) {
    const url = new URL(request.url);
    
    // Determine which caches to invalidate based on the request
    if (url.pathname.includes('/chatbots')) {
      const cache = await caches.open(API_CACHE);
      const keys = await cache.keys();
      
      for (const key of keys) {
        if (key.url.includes('/chatbots')) {
          await cache.delete(key);
        }
      }
    }
  }

  async getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    }
    
    return status;
  }

  async clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(cacheNames.map(name => caches.delete(name)));
  }

  async preloadRoute(route) {
    try {
      const response = await fetch(route);
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(route, response);
      }
    } catch (error) {
      console.warn(`Failed to preload route ${route}:`, error);
    }
  }

  notifyClients(message) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage(message));
    });
  }

  async initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CogniBotSW', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('queue', 'queue', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async getIndexedDB() {
    if (!this.db) {
      this.db = await this.initializeIndexedDB();
    }
    return this.db;
  }
}

// Initialize the service worker
const sw = new AdvancedServiceWorker();
