
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

  const fetchReminders = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "Error loading reminders",
        description: "Unable to fetch reminders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createReminder = async (reminderData: {
    title: string;
    description?: string;
    reminder_date: string;
    reminder_type?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .insert({
          ...reminderData,
          user_id: user.id,
          reminder_type: reminderData.reminder_type || 'general'
        });

      if (error) throw error;

      toast({
        title: "Reminder created",
        description: "Your reminder has been created successfully"
      });

      fetchReminders();
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive"
      });
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Reminder updated",
        description: "Your reminder has been updated"
      });

      fetchReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive"
      });
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Reminder deleted",
        description: "Your reminder has been deleted"
      });

      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  return {
    reminders,
    isLoading,
    createReminder,
    updateReminder,
    deleteReminder,
    refetch: fetchReminders
  };
};
