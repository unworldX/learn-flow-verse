import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

export const useStudyProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const sb: any = supabase;
        const { data, error } = await sb
          .from('study_plans')
          .select('*')
          .eq('user_id', user.id);
        if (error) throw error;
        setProgress(data);
      } catch (error) {
        console.error('Error fetching study progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  return { progress, isLoading };
};
