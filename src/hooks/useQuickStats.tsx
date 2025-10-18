import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

type QuickStats = {
  resourcesUploaded: number;
  notesCreated: number;
  chatsStarted: number;
};

export const useQuickStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // Compute quick stats from existing tables to avoid relying on a non-existent "quick_stats" table
        const sb: any = supabase; // avoid heavy generic instantiation from supabase-js types
        const [{ count: resourcesCount }, { count: notesCount }, { count: chatCount }] = await Promise.all([
          sb.from('resources').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          sb.from('collaborative_notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          sb.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        setStats({
          resourcesUploaded: resourcesCount ?? 0,
          notesCreated: notesCount ?? 0,
          chatsStarted: chatCount ?? 0,
        });
      } catch (error) {
        console.error('Error computing quick stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, isLoading };
};
