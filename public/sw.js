// Service worker (Day 5)
// Keeps the app installable and shows a friendly page when offline.
// It does NOT cache your pages or data, so people never see stale or other
// people's content. Push notifications get added to this file on Day 6.

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; min-height: 100vh;
           align-items: center; justify-content: center; margin: 0; padding: 24px;
           text-align: center; background: #fff; color: #111827; }
    @media (prefers-color-scheme: dark) { body { background: #111827; color: #f9fafb; } }
    button { margin-top: 16px; padding: 10px 18px; border-radius: 8px; border: 0;
             background: #4f46e5; color: #fff; font-size: 15px; }
  </style>
</head>
<body>
  <div>
    <h1 style="font-size:20px;margin:0 0 8px">You're offline</h1>
    <p style="margin:0;opacity:.75">Check your internet connection and try again.</p>
    <button onclick="location.reload()">Try again</button>
  </div>
</body>
</html>`

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Only handle page loads. Everything else goes straight to the network.
  if (event.request.mode !== 'navigate') return

  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(OFFLINE_HTML, {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    )
  )
})
