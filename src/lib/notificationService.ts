import { supabase } from '@/integrations/supabase/client';

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  study_reminders: boolean;
  new_messages: boolean;
}

export type NotificationType = 'email' | 'push' | 'study_reminder' | 'new_message';

class NotificationService {
  private preferences: NotificationPreferences | null = null;

  /**
   * Load notification preferences from localStorage or database
   */
  async loadPreferences(userId?: string): Promise<void> {
    try {
      // First try localStorage
      const stored = localStorage.getItem('user_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.preferences = {
          email_notifications: settings.email_notifications ?? true,
          push_notifications: settings.push_notifications ?? true,
          study_reminders: settings.study_reminders ?? true,
          new_messages: settings.new_messages ?? true,
        };
        return;
      }

      // If not in localStorage and userId provided, fetch from database
      if (userId) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('email_notifications, push_notifications, study_reminders, new_messages')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          this.preferences = data;
        }
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  /**
   * Check if a specific notification type is enabled
   */
  isEnabled(type: NotificationType): boolean {
    if (!this.preferences) {
      // Default to true if preferences not loaded
      return true;
    }

    switch (type) {
      case 'email':
        return this.preferences.email_notifications;
      case 'push':
        return this.preferences.push_notifications;
      case 'study_reminder':
        return this.preferences.study_reminders;
      case 'new_message':
        return this.preferences.new_messages;
      default:
        return true;
    }
  }

  /**
   * Send an email notification (if enabled)
   */
  async sendEmailNotification(to: string, subject: string, body: string): Promise<boolean> {
    if (!this.isEnabled('email')) {
      console.log('Email notifications disabled by user');
      return false;
    }

    try {
      // TODO: Implement actual email sending via Supabase Edge Function or external service
      console.log('Sending email notification:', { to, subject });
      
      // Example implementation:
      // const { error } = await supabase.functions.invoke('send-email', {
      //   body: { to, subject, body }
      // });
      // if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  /**
   * Send a push notification (if enabled)
   */
  async sendPushNotification(title: string, body: string, data?: any): Promise<boolean> {
    if (!this.isEnabled('push')) {
      console.log('Push notifications disabled by user');
      return false;
    }

    try {
      // Check if push notifications are supported
      if (!('Notification' in window)) {
        console.log('Push notifications not supported');
        return false;
      }

      // Request permission if not granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          return false;
        }
      }

      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/logo.png',
          data,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Schedule a study reminder (if enabled)
   */
  async scheduleStudyReminder(title: string, time: Date): Promise<boolean> {
    if (!this.isEnabled('study_reminder')) {
      console.log('Study reminders disabled by user');
      return false;
    }

    try {
      // TODO: Implement study reminder scheduling
      console.log('Scheduling study reminder:', { title, time });
      
      // This could use browser notifications, or store in database for server-side scheduling
      const delay = time.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          this.sendPushNotification('Study Reminder', title);
        }, delay);
      }
      
      return true;
    } catch (error) {
      console.error('Error scheduling study reminder:', error);
      return false;
    }
  }

  /**
   * Notify about new messages (if enabled)
   */
  async notifyNewMessage(from: string, preview: string): Promise<boolean> {
    if (!this.isEnabled('new_message')) {
      console.log('New message notifications disabled by user');
      return false;
    }

    try {
      await this.sendPushNotification(
        `New message from ${from}`,
        preview
      );
      return true;
    } catch (error) {
      console.error('Error notifying new message:', error);
      return false;
    }
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    if (!this.preferences) {
      this.preferences = {
        email_notifications: true,
        push_notifications: true,
        study_reminders: true,
        new_messages: true,
      };
    }
    
    this.preferences = {
      ...this.preferences,
      ...preferences,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
