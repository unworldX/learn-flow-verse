
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cacheService } from '@/lib/cacheService';

export interface UserSettings {
  id?: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  study_reminders: boolean;
  new_messages: boolean;
  profile_visibility: boolean;
  activity_status: boolean;
  data_collection: boolean;
  theme: 'light' | 'dark' | 'auto';
  font_size: 'small' | 'medium' | 'large';
  ai_suggestions: boolean;
  ai_autocomplete: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const defaultSettings: Omit<UserSettings, 'user_id'> = {
    email_notifications: true,
    push_notifications: true,
    study_reminders: true,
    new_messages: true,
    profile_visibility: true,
    activity_status: true,
    data_collection: false,
    theme: 'auto',
    font_size: 'medium',
    ai_suggestions: true,
    ai_autocomplete: true,
  };

  const validateAndCastSettings = (data: any): UserSettings => {
    return {
      ...data,
      theme: ['light', 'dark', 'auto'].includes(data.theme) ? data.theme : 'auto',
      font_size: ['small', 'medium', 'large'].includes(data.font_size) ? data.font_size : 'medium',
    };
  };

  const loadSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const cacheKey = `user_settings_${user.id}`;
      
      // Try to get from cache first
      let cachedSettings = await cacheService.get<UserSettings>(cacheKey);
      if (cachedSettings) {
        setSettings(validateAndCastSettings(cachedSettings));
        setIsLoading(false);
        return;
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const validatedSettings = validateAndCastSettings(data);
        setSettings(validatedSettings);
        await cacheService.set(cacheKey, validatedSettings, { ttlMinutes: 30 });
      } else {
        // Create default settings
        const newSettings = { ...defaultSettings, user_id: user.id };
        const { data: created, error: createError } = await supabase
          .from('user_settings')
          .insert(newSettings)
          .select()
          .single();

        if (createError) throw createError;

        const validatedSettings = validateAndCastSettings(created);
        setSettings(validatedSettings);
        await cacheService.set(cacheKey, validatedSettings, { ttlMinutes: 30 });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error loading settings",
        description: "Failed to load your settings. Using defaults.",
        variant: "destructive"
      });
      setSettings({ ...defaultSettings, user_id: user.id });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return;

    setIsSaving(true);
    try {
      const updatedSettings = { ...settings, ...updates };
      
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const validatedSettings = validateAndCastSettings(data);
      setSettings(validatedSettings);
      
      // Update cache
      const cacheKey = `user_settings_${user.id}`;
      await cacheService.set(cacheKey, validatedSettings, { ttlMinutes: 30 });

      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error updating settings",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    refetch: loadSettings
  };
};
