/**
 * Push Notifications Service
 * Handles browser push notifications for messages
 */

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async init(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[PushNotifications] Not supported in this browser");
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register("/sw.js");
      console.log("[PushNotifications] Service worker registered");
      return true;
    } catch (error) {
      console.error("[PushNotifications] Failed to register service worker:", error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.warn("[PushNotifications] Not supported");
      return "denied";
    }

    const permission = await Notification.requestPermission();
    console.log("[PushNotifications] Permission:", permission);
    return permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      return null;
    }

    try {
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey || undefined,
      });

      console.log("[PushNotifications] Subscribed:", subscription);
      return subscription;
    } catch (error) {
      console.error("[PushNotifications] Failed to subscribe:", error);
      return null;
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission !== "granted") {
      console.warn("[PushNotifications] Permission denied");
      return;
    }

    if (!this.registration) {
      // Fallback to browser notification
      new Notification(title, options);
      return;
    }

    await this.registration.showNotification(title, {
      icon: "/logo.png",
      badge: "/logo.png",
      ...options,
    });
  }

  async notifyNewMessage(sender: string, message: string, chatId: string): Promise<void> {
    await this.showNotification(`New message from ${sender}`, {
      body: message,
      tag: chatId,
    });
  }

  async notifyIncomingCall(caller: string, callType: "voice" | "video"): Promise<void> {
    await this.showNotification(`Incoming ${callType} call`, {
      body: `${caller} is calling you`,
      tag: "incoming-call",
      requireInteraction: true,
    });
  }
}

// Export singleton
export const pushNotifications = new PushNotificationService();
