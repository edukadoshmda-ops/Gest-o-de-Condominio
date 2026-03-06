/* Service Worker - Web Push notifications */
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()) })

self.addEventListener('push', (e) => {
  const data = e.data?.json() || {}
  const title = data.title || 'Gestor360'
  const options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'notif',
    data: data.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: data.actions || [],
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length) {
        const w = list.find((c) => c.url.startsWith(self.location.origin))
        if (w) w.focus()
        else clients.openWindow(url)
      } else {
        clients.openWindow(url)
      }
    })
  )
})
