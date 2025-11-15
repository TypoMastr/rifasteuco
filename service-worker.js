const CACHE_NAME = 'rifas-teuco-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/metadata.json',
  'https://teuco.com.br/rifas/icone_rifas.png',
];

// Instala o service worker e pré-carrega os recursos essenciais do app.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Intercepta as requisições de rede.
self.addEventListener('fetch', event => {
  // Ignora as chamadas para a API, sempre buscando-as na rede para obter dados atualizados.
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para todas as outras requisições (arquivos do app), usa a estratégia "cache-first".
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso estiver no cache, retorna-o.
        if (response) {
          return response;
        }

        // Se não, busca na rede.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Verifica se a resposta é válida.
            // Ignora requisições de extensões do Chrome.
            if (!response || response.status !== 200 || response.type === 'opaque' || event.request.url.startsWith('chrome-extension://')) {
              return response;
            }

            // Clona a resposta e a armazena no cache para uso futuro.
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Ativa o service worker e limpa caches antigos.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});