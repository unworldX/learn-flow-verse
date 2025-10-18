import { useEffect } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { notificationService } from '@/lib/notificationService';
import { privacyService } from '@/lib/privacyService';
import { aiFeatureService } from '@/lib/aiFeatureService';

/**
 * Hook to initialize all settings-related services
 * This should be called once in your main App component
 */
export const useInitializeSettings = () => {
  const { user } = useAuth();

  useEffect(() => {
    const initializeServices = async () => {
      if (user) {
        // Load user preferences for all services
        await notificationService.loadPreferences(user.id);
        await privacyService.loadSettings(user.id);
        aiFeatureService.loadSettings();

        console.log('Settings services initialized');
      }
    };

    initializeServices();
  }, [user]);
};

/**
 * Utility to get all current settings from localStorage
 */
export const getCurrentSettings = () => {
  try {
    const stored = localStorage.getItem('user_settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting current settings:', error);
  }
  return null;
};

/**
 * Export all services for easy import
 */
export { notificationService } from '@/lib/notificationService';
export { privacyService } from '@/lib/privacyService';
export { aiFeatureService } from '@/lib/aiFeatureService';
