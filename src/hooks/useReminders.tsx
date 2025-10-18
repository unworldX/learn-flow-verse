
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleRLSError } from '@/lib/auth';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  is_completed: boolean;
  reminder_type: string;
  created_at: string;
}

export const useReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('id, user_id, title, description, reminder_date, is_completed, reminder_type, created_at')
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error fetching reminders:', error);
      toast({
        title: "Error loading reminders",
        description: friendlyMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const createReminder = async (reminderData: {
    title: string;
    description?: string | null;
    reminder_date: string;
    reminder_type?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .insert({
          user_id: user.id,
          title: reminderData.title,
          description: reminderData.description,
          reminder_date: reminderData.reminder_date,
          reminder_type: reminderData.reminder_type || 'general',
          is_completed: false
        });

      if (error) throw error;

      await fetchReminders();
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error creating reminder:', error);
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive"
      });
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchReminders();
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error updating reminder:', error);
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive"
      });
    }
  };

  const deleteReminder = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchReminders();
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error deleting reminder:', error);
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user, fetchReminders]);

  return {
    reminders,
    isLoading,
    createReminder,
    updateReminder,
    deleteReminder,
    refetch: fetchReminders
  };
};
