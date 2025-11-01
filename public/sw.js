// Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker");
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("[SW] Failed to parse push data", e);
  }

  const title = data.title || "New Message";
  const options = {
    body: data.body || "You have a new message",
    icon: "/logo.png",
    badge: "/logo.png",
    data: data.data || {},
    actions: data.actions || [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click", event.action);

  event.notification.close();

  if (event.action === "view" || !event.action) {
    const urlToOpen = event.notification.data?.url || "/conversations";
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
