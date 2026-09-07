// Minimal service worker: only makes the admin panel installable as a PWA.
// It deliberately does NOT cache /admin (HTML) or /api/* — admin data must
// always be fresh, never served stale from offline cache.
const CACHE_NAME = "grontals-admin-v1";
const PRECACHE_URLS = ["/admin.js", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== "GET" || !PRECACHE_URLS.includes(url.pathname)) {
		return;
	}
	event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
