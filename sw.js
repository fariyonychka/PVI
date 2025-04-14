const CACHE_NAME = "pwa-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./messages.html",
  "./students.html",
  "./tasks.html",
  "./style.css",
  "./header.css",
  "./navigation.css",
  "./script.js",
  "./christmas-bell.png",
  "./close.png",
  "./edit.png",
  "./more.png",
  "./studenticon.png",
  "./trash.png",
  "./usericon.png",
  "./icon/icon-96x96.png",
  "./icon/icon-128x128.png",
  "./icon/icon-144x144.png",
  "./screenshots/screenshot1.png"
];

// Встановлення Service Worker
self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.all(
            ASSETS.map(url=>cache.add(url).catch(err=>console.error('Failed to cache:${url}, err')))
        );
      })
    );
    console.log("Install");
  });

// Обробка запитів (кеш або мережа)
self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);

  // Не кешуємо API-запити (з `/api/`)
  if (url.pathname.startsWith("/PVI/server/index.php/api/")) {
    return; // Дозволяємо браузеру робити звичайний запит
  }

  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(event.request).then(function (cachedResponse) {
        return cachedResponse || fetch(event.request).then(function (response) {
          cache.put(event.request.clone(), response.clone());
          return response;
        });
      });
    })
  );
});



  

// Оновлення кешу при активації нового Service Worker
self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME) // Знаходимо старі кеші
            .map((key) => caches.delete(key))   // Видаляємо їх
        );
      }).then(() => {
        console.log("Новий Service Worker активовано.");
        return self.clients.claim(); // Переключаємо новий SW для всіх вкладок
      })
    );
  });



