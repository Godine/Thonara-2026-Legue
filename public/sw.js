const CACHE_VERSION = 'thonara-v2'
const STATIC_CACHE  = 'thonara-static-v1'
const PRECACHE_URLS = ['/', '/stats', '/history', '/achievements', '/rules', '/records']

// ── Lifecycle ─────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch handler ─────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never intercept Supabase — always live
  if (url.hostname.includes('supabase.co')) return

  // Only handle same-origin + CDN requests
  if (!url.protocol.startsWith('http')) return

  // Hashed static assets (JS chunks, CSS, fonts) — cache forever
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image/')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Player photos, icons, manifest — cache forever
  if (
    url.pathname.startsWith('/photos/') ||
    url.pathname === '/icon' ||
    url.pathname === '/apple-icon' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // All same-origin pages — network first with 4s timeout, fall back to cache
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request))
    return
  }
})

// ── Strategies ────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4000)

  try {
    const response = await fetch(request, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (response.ok && response.status < 400) {
      const cache = await caches.open(CACHE_VERSION)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    clearTimeout(timeoutId)
    const cached = await caches.match(request)
    if (cached) return cached

    // Navigation fallback: serve cached home shell
    if (request.mode === 'navigate') {
      const home = await caches.match('/')
      if (home) return home
    }

    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
