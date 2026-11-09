// Service worker «Результатов»: нужен, чтобы приложение ставилось на телефон и открывалось без сети.
// Сначала всегда сеть (новая версия видна сразу), кэш — только если интернета нет.
// Запросы к серверу Apps Script (script.google.com) не трогаем.
// Пути относительные: на GitHub Pages приложение живёт в подпапке /rezultaty/.
const CACHE = 'rezultaty-v1';
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // GitHub Pages кэширует файлы на 10 минут — страницу всегда перепроверяем у сервера.
  const net = req.mode === 'navigate' ? fetch(req.url, { cache: 'no-cache' }) : fetch(req);
  e.respondWith(
    net.then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./') : Response.error())))
  );
});
