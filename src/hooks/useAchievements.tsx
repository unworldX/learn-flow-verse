import { useState, useEffect, useRef } from 'react';

interface Achievement {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  icon?: string | null;
  tier?: string | null;
  image_url?: string | null;
  color?: string | null;
  earned?: boolean;
}

interface PgErrorLike { code?: string; message?: string }
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [missingSchema, setMissingSchema] = useState(false);
  const loggedMissingRef = useRef(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // Use untyped access because tables may not exist in generated types yet
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = supabase as any;
        const { data: all, error: allError } = await raw
          .from('achievements')
          .select('id,name,description,icon,tier,image_url,color,created_at');
        if (allError) {
          const pgErr = allError as PgErrorLike;
          if (pgErr.code === '42P01') {
            setMissingSchema(true);
            if (!loggedMissingRef.current) {
              console.warn('[useAchievements] achievements table missing. Suppressing further errors.');
              loggedMissingRef.current = true;
            }
            setAchievements([]);
            setAllAchievements([]);
            return; // stop further queries
          }
          throw allError;
        }
        setAllAchievements((all || []) as Achievement[]);

        // Fetch user's earned achievements
        const { data: earned, error: earnedError } = await raw
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', user.id);
        if (earnedError) {
          const pgErr = earnedError as PgErrorLike;
          if (pgErr.code === '42P01') {
            setMissingSchema(true);
            if (!loggedMissingRef.current) {
              console.warn('[useAchievements] user_achievements table missing.');
              loggedMissingRef.current = true;
            }
            setAchievements((all || []).map((ach: Achievement) => ({ ...ach, earned: false })) as Achievement[]);
            return;
          }
          throw earnedError;
        }
        
        const earnedIds = (earned || []).map((a: { achievement_id: string }) => a.achievement_id);
        const combined = (all || []).map((ach: Achievement) => ({
          ...ach,
          earned: earnedIds.includes(ach.id)
        }));
        setAchievements(combined as Achievement[]);

      } catch (error) {
        const pgErr = error as PgErrorLike;
        if (pgErr.code !== '42P01') {
          console.error('Error fetching achievements:', pgErr);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [user]);

  return { achievements, isLoading, missingSchema };
};
