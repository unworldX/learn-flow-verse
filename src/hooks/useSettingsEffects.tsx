import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { UserSettings } from './useUserSettings';

/**
 * Hook to apply user settings to the application
 * This makes settings actually work by applying them to the DOM and app behavior
 */
export const useSettingsEffects = (settings: UserSettings | null) => {
  const { setTheme } = useTheme();

  // Apply theme changes
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, setTheme]);

  // Apply font size changes
  useEffect(() => {
    if (settings?.font_size) {
      const root = document.documentElement;
      
      // Remove all font size classes
      root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
      
      // Add the current font size class
      root.classList.add(`font-size-${settings.font_size}`);
    }
  }, [settings?.font_size]);

  // Apply data collection preference
  useEffect(() => {
    if (settings?.data_collection !== undefined) {
      // Store in localStorage so analytics services can check this
      localStorage.setItem('data_collection_enabled', settings.data_collection.toString());
      
      // You can also disable analytics here if needed
      if (!settings.data_collection) {
        // Example: window.gtag?.('consent', 'update', { 'analytics_storage': 'denied' });
        console.log('Data collection disabled by user preference');
      }
    }
  }, [settings?.data_collection]);

  // Store other settings in localStorage for easy access across the app
  useEffect(() => {
    if (settings) {
      localStorage.setItem('user_settings', JSON.stringify(settings));
    }
  }, [settings]);
};
