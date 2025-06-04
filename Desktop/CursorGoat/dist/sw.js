/**
 * ===== SOGESTMATIC SERVICE WORKER v2.1 =====
 * Service Worker pour PWA avec cache intelligent
 */

const CACHE_NAME = 'sogestmatic-v2.1.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

// Fichiers à mettre en cache immédiatement
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/sw.js'
];

// URLs API à mettre en cache
const API_ENDPOINTS = [
    '/infractions',
    '/categories',
    '/gravites',
    '/stats'
];

// Configuration du cache
const CACHE_CONFIG = {
    // Durée de vie des caches (en millisecondes)
    STATIC_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 jours
    DYNAMIC_MAX_AGE: 24 * 60 * 60 * 1000,     // 1 jour
    API_MAX_AGE: 30 * 60 * 1000,              // 30 minutes
    
    // Taille maximale des caches
    MAX_STATIC_ITEMS: 50,
    MAX_DYNAMIC_ITEMS: 100,
    MAX_API_ITEMS: 50
};

console.log('🚛 Service Worker Sogestmatic chargé');

// ===== INSTALLATION =====
self.addEventListener('install', event => {
    console.log('📦 Installation du Service Worker');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('💾 Mise en cache des fichiers statiques');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Installation terminée');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Erreur installation:', error);
            })
    );
});

// ===== ACTIVATION =====
self.addEventListener('activate', event => {
    console.log('🔄 Activation du Service Worker');
    
    event.waitUntil(
        Promise.all([
            // Nettoyer les anciens caches
            cleanOldCaches(),
            // Prendre le contrôle de tous les clients
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Activation terminée');
        })
    );
});

// ===== FETCH HANDLER =====
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorer certaines requêtes
    if (shouldIgnoreRequest(request)) {
        return;
    }
    
    // Stratégie selon le type de requête
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else {
        event.respondWith(handleDynamicRequest(request));
    }
});

// ===== GESTION DES MESSAGES =====
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                type: 'VERSION',
                version: CACHE_NAME
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({
                    type: 'CACHE_CLEARED',
                    success: true
                });
            });
            break;
            
        case 'CACHE_API_DATA':
            cacheAPIData(data).then(() => {
                event.ports[0].postMessage({
                    type: 'API_DATA_CACHED',
                    success: true
                });
            });
            break;
    }
});

// ===== FONCTIONS UTILITAIRES =====

function shouldIgnoreRequest(request) {
    const url = new URL(request.url);
    
    // Ignorer les requêtes externes (sauf API)
    if (url.origin !== self.location.origin && !isAPIRequest(request)) {
        return true;
    }
    
    // Ignorer les WebSockets
    if (request.headers.get('upgrade') === 'websocket') {
        return true;
    }
    
    // Ignorer les requêtes POST/PUT/DELETE non-API
    if (['POST', 'PUT', 'DELETE'].includes(request.method) && !isAPIRequest(request)) {
        return true;
    }
    
    return false;
}

function isStaticAsset(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    return STATIC_ASSETS.includes(pathname) ||
           pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.json') ||
           pathname.endsWith('.ico') ||
           pathname === '/';
}

function isAPIRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    return pathname.startsWith('/api/') ||
           pathname.startsWith('/infractions') ||
           pathname.startsWith('/categories') ||
           pathname.startsWith('/gravites') ||
           pathname.startsWith('/stats') ||
           pathname.startsWith('/chat') ||
           pathname.startsWith('/health') ||
           pathname.startsWith('/.netlify/functions/');
}

// ===== STRATÉGIES DE CACHE =====

async function handleStaticAsset(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // Vérifier la fraîcheur
        const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
        const now = new Date();
        
        if (now - cacheDate < CACHE_CONFIG.STATIC_MAX_AGE) {
            console.log(`📄 Cache statique: ${request.url}`);
            return cachedResponse;
        }
    }
    
    try {
        console.log(`🌐 Fetch statique: ${request.url}`);
        const response = await fetch(request);
        
        if (response.ok) {
            const responseToCache = response.clone();
            responseToCache.headers.append('sw-cache-date', new Date().toISOString());
            cache.put(request, responseToCache);
        }
        
        return response;
    } catch (error) {
        console.log(`💾 Fallback cache statique: ${request.url}`);
        return cachedResponse || createOfflineResponse(request);
    }
}

async function handleAPIRequest(request) {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Strategy: Network First avec cache de secours
    try {
        console.log(`🌐 API Request: ${request.url}`);
        const response = await fetch(request, {
            ...request,
            headers: {
                ...request.headers,
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            const responseToCache = response.clone();
            responseToCache.headers.append('sw-cache-date', new Date().toISOString());
            cache.put(request, responseToCache);
            
            // Limiter la taille du cache API
            limitCacheSize(API_CACHE, CACHE_CONFIG.MAX_API_ITEMS);
        }
        
        return response;
    } catch (error) {
        console.log(`💾 API Cache fallback: ${request.url}`);
        
        if (cachedResponse) {
            // Ajouter un header pour indiquer que c'est du cache
            const response = cachedResponse.clone();
            response.headers.append('sw-from-cache', 'true');
            return response;
        }
        
        return createOfflineAPIResponse(request);
    }
}

async function handleDynamicRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    try {
        console.log(`🌐 Dynamic request: ${request.url}`);
        const response = await fetch(request);
        
        if (response.ok) {
            const responseToCache = response.clone();
            responseToCache.headers.append('sw-cache-date', new Date().toISOString());
            cache.put(request, responseToCache);
            
            // Limiter la taille du cache dynamique
            limitCacheSize(DYNAMIC_CACHE, CACHE_CONFIG.MAX_DYNAMIC_ITEMS);
        }
        
        return response;
    } catch (error) {
        console.log(`💾 Dynamic cache fallback: ${request.url}`);
        return cachedResponse || createOfflineResponse(request);
    }
}

// ===== RÉPONSES HORS LIGNE =====

function createOfflineResponse(request) {
    const url = new URL(request.url);
    
    if (request.destination === 'document' || url.pathname === '/') {
        return new Response(createOfflineHTML(), {
            status: 200,
            statusText: 'OK',
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'sw-offline': 'true'
            }
        });
    }
    
    return new Response('Hors ligne', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'sw-offline': 'true'
        }
    });
}

function createOfflineAPIResponse(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Données de démonstration pour mode hors ligne
    let offlineData = {
        message: 'Mode hors ligne - Données limitées',
        offline: true,
        timestamp: new Date().toISOString()
    };
    
    if (pathname.includes('/infractions')) {
        offlineData = {
            ...offlineData,
            infractions: [],
            total: 0,
            message: 'Recherche non disponible hors ligne. Connectez-vous pour accéder à la base de données complète.'
        };
    } else if (pathname.includes('/stats')) {
        offlineData = {
            ...offlineData,
            total_infractions: 459,
            chat_interactions: 0,
            search_queries: 0,
            last_update: new Date().toISOString()
        };
    } else if (pathname.includes('/chat')) {
        offlineData = {
            ...offlineData,
            response: 'Le chat IA n\'est pas disponible hors ligne. Reconnectez-vous pour utiliser l\'assistant juridique.',
            detecte_exceptions: false
        };
    }
    
    return new Response(JSON.stringify(offlineData), {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'sw-offline': 'true'
        }
    });
}

function createOfflineHTML() {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sogestmatic - Mode Hors Ligne</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            max-width: 600px;
            padding: 2rem;
        }
        .logo {
            font-size: 4rem;
            margin-bottom: 2rem;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .retry-btn {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        .retry-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .features {
            margin-top: 3rem;
            opacity: 0.8;
        }
        .features h3 {
            margin-bottom: 1rem;
        }
        .features ul {
            list-style: none;
            padding: 0;
        }
        .features li {
            margin: 0.5rem 0;
        }
        .features li:before {
            content: "✓ ";
            font-weight: bold;
            margin-right: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚛</div>
        <h1>Sogestmatic</h1>
        <p>Mode Hors Ligne</p>
        <p>L'application est temporairement indisponible. Certaines fonctionnalités peuvent être limitées en mode hors ligne.</p>
        
        <button class="retry-btn" onclick="window.location.reload()">
            🔄 Réessayer la connexion
        </button>
        
        <div class="features">
            <h3>Fonctionnalités en mode hors ligne :</h3>
            <ul>
                <li>Consultation des données en cache</li>
                <li>Interface complète disponible</li>
                <li>Données sauvegardées localement</li>
                <li>Synchronisation automatique au retour en ligne</li>
            </ul>
        </div>
    </div>
    
    <script>
        // Vérifier la connexion périodiquement
        setInterval(() => {
            if (navigator.onLine) {
                window.location.reload();
            }
        }, 10000);
        
        // Écouter les changements de connexion
        window.addEventListener('online', () => {
            window.location.reload();
        });
    </script>
</body>
</html>
    `.trim();
}

// ===== GESTION DES CACHES =====

async function cleanOldCaches() {
    const cacheNames = await caches.keys();
    
    return Promise.all(
        cacheNames
            .filter(cacheName => {
                // Supprimer les anciens caches Sogestmatic
                return cacheName.startsWith('sogestmatic-') && cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
                console.log(`🗑️ Suppression ancien cache: ${cacheName}`);
                return caches.delete(cacheName);
            })
    );
}

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    
    return Promise.all(
        cacheNames
            .filter(cacheName => cacheName.startsWith('sogestmatic-'))
            .map(cacheName => {
                console.log(`🗑️ Suppression cache: ${cacheName}`);
                return caches.delete(cacheName);
            })
    );
}

async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
        // Supprimer les plus anciens (FIFO)
        const keysToDelete = keys.slice(0, keys.length - maxItems);
        return Promise.all(
            keysToDelete.map(key => cache.delete(key))
        );
    }
}

async function cacheAPIData(data) {
    const cache = await caches.open(API_CACHE);
    const { endpoint, responseData } = data;
    
    const response = new Response(JSON.stringify(responseData), {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'sw-cache-date': new Date().toISOString(),
            'sw-manual-cache': 'true'
        }
    });
    
    return cache.put(endpoint, response);
}

// ===== NOTIFICATIONS PUSH (PRÉPARATION) =====

self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const title = data.title || 'Sogestmatic';
    const options = {
        body: data.body || 'Nouvelle notification',
        icon: '/android-chrome-192x192.png',
        badge: '/android-chrome-96x96.png',
        tag: data.tag || 'sogestmatic-notification',
        data: data.data || {},
        actions: [
            {
                action: 'open',
                title: 'Ouvrir'
            },
            {
                action: 'close',
                title: 'Fermer'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// ===== SYNC EN ARRIÈRE-PLAN (PRÉPARATION) =====

self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    console.log('🔄 Synchronisation en arrière-plan');
    
    try {
        // Synchroniser les données mises en cache
        const cache = await caches.open(API_CACHE);
        const keys = await cache.keys();
        
        for (const request of keys) {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    const responseToCache = response.clone();
                    responseToCache.headers.append('sw-cache-date', new Date().toISOString());
                    await cache.put(request, responseToCache);
                }
            } catch (error) {
                console.log(`❌ Erreur sync: ${request.url}`);
            }
        }
        
        console.log('✅ Synchronisation terminée');
    } catch (error) {
        console.error('❌ Erreur synchronisation:', error);
    }
}

// ===== MÉTRIQUES ET MONITORING =====

function logCacheUsage() {
    caches.keys().then(cacheNames => {
        cacheNames.forEach(async cacheName => {
            if (cacheName.startsWith('sogestmatic-')) {
                const cache = await caches.open(cacheName);
                const keys = await cache.keys();
                console.log(`📊 Cache ${cacheName}: ${keys.length} entrées`);
            }
        });
    });
}

// Log des métriques toutes les heures en développement
if (self.location.hostname === 'localhost') {
    setInterval(logCacheUsage, 60 * 60 * 1000);
}

console.log('✅ Service Worker Sogestmatic v2.1 prêt'); 