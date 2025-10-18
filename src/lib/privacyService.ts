import { supabase } from '@/integrations/supabase/client';

export interface PrivacySettings {
  profile_visibility: boolean;
  activity_status: boolean;
  data_collection: boolean;
}

class PrivacyService {
  private settings: PrivacySettings | null = null;

  /**
   * Load privacy settings from localStorage or database
   */
  async loadSettings(userId?: string): Promise<void> {
    try {
      // First try localStorage
      const stored = localStorage.getItem('user_settings');
      if (stored) {
        const userSettings = JSON.parse(stored);
        this.settings = {
          profile_visibility: userSettings.profile_visibility ?? true,
          activity_status: userSettings.activity_status ?? true,
          data_collection: userSettings.data_collection ?? false,
        };
        return;
      }

      // If not in localStorage and userId provided, fetch from database
      if (userId) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('profile_visibility, activity_status, data_collection')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          this.settings = data;
        }
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  }

  /**
   * Check if profile is visible to others
   */
  isProfileVisible(): boolean {
    return this.settings?.profile_visibility ?? true;
  }

  /**
   * Check if activity status should be shown
   */
  isActivityStatusVisible(): boolean {
    return this.settings?.activity_status ?? true;
  }

  /**
   * Check if data collection is enabled
   */
  isDataCollectionEnabled(): boolean {
    return this.settings?.data_collection ?? false;
  }

  /**
   * Update privacy settings
   */
  updateSettings(settings: Partial<PrivacySettings>): void {
    if (!this.settings) {
      this.settings = {
        profile_visibility: true,
        activity_status: true,
        data_collection: false,
      };
    }
    
    this.settings = {
      ...this.settings,
      ...settings,
    };

    // Store in localStorage for immediate access
    const stored = localStorage.getItem('user_settings');
    if (stored) {
      const userSettings = JSON.parse(stored);
      localStorage.setItem('user_settings', JSON.stringify({
        ...userSettings,
        ...settings,
      }));
    }
  }

  /**
   * Get filtered profile data based on visibility settings
   * This should be used when fetching profile data for display to others
   */
  async getVisibleProfile(userId: string, viewerId?: string): Promise<any> {
    try {
      // If viewing own profile, return everything
      if (userId === viewerId) {
        return { userId, isOwn: true, visible: true };
      }

      // Load privacy settings for this user
      const { data: settings } = await supabase
        .from('user_settings')
        .select('profile_visibility, activity_status')
        .eq('user_id', userId)
        .single();

      // If profile is not visible, return minimal data
      if (settings && !settings.profile_visibility) {
        return {
          userId,
          visible: false,
          activityVisible: false,
        };
      }

      return {
        userId,
        visible: true,
        activityVisible: settings?.activity_status ?? true,
      };
    } catch (error) {
      console.error('Error getting visible profile:', error);
      return null;
    }
  }

  /**
   * Update user's online status based on activity_status setting
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    // Only update if activity status is visible
    if (!this.isActivityStatusVisible()) {
      console.log('Activity status updates disabled by user');
      return;
    }

    try {
      // This would update the user's status in a user_status table if it exists
      // For now, just log it
      console.log('Updating online status:', { userId, isOnline });
      
      // Example implementation if you have a user_status table:
      // await supabase
      //   .from('user_status')
      //   .upsert({
      //     user_id: userId,
      //     is_online: isOnline,
      //     last_seen: new Date().toISOString(),
      //   });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  /**
   * Track analytics event only if data collection is enabled
   */
  trackEvent(eventName: string, eventData?: any): void {
    if (!this.isDataCollectionEnabled()) {
      console.log('Analytics tracking disabled by user');
      return;
    }

    try {
      // TODO: Implement actual analytics tracking
      console.log('Analytics event:', eventName, eventData);
      
      // Example implementations:
      // window.gtag?.('event', eventName, eventData);
      // window.analytics?.track(eventName, eventData);
      // plausible(eventName, { props: eventData });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Check if user consents to cookies/tracking
   */
  hasDataCollectionConsent(): boolean {
    return this.isDataCollectionEnabled();
  }
}

// Export singleton instance
export const privacyService = new PrivacyService();
