const CACHE_NAME = 'tria-shell-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const app = clients.find((client) => 'focus' in client)
    return app ? app.focus() : self.clients.openWindow('/')
  }))
})
