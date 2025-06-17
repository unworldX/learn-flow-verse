
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cacheService } from '@/lib/cacheService';

export interface GamificationData {
  user_id: string;
  points: number;
  level: number;
  badges: string[];
  last_updated: string;
}

export const useGamification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGamificationData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const cacheKey = `gamification_${user.id}`;
      
      // Try cache first
      let cachedData = await cacheService.get<GamificationData>(cacheKey);
      if (cachedData) {
        setGamificationData(cachedData);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Create default gamification record
        const { data: newData, error: createError } = await supabase
          .from('gamification')
          .insert({
            user_id: user.id,
            points: 0,
            level: 1,
            badges: []
          })
          .select()
          .single();

        if (createError) throw createError;
        setGamificationData(newData as GamificationData);
        await cacheService.set(cacheKey, newData, { ttlMinutes: 60 });
      } else {
        setGamificationData(data as GamificationData);
        await cacheService.set(cacheKey, data, { ttlMinutes: 60 });
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      toast({
        title: "Error loading progress",
        description: "Unable to fetch your progress data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addPoints = async (points: number, reason: string) => {
    if (!user || !gamificationData) return;

    try {
      const newPoints = gamificationData.points + points;
      const newLevel = Math.floor(newPoints / 100) + 1; // Level up every 100 points

      const { error } = await supabase
        .from('gamification')
        .update({
          points: newPoints,
          level: newLevel,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Check for level up
      if (newLevel > gamificationData.level) {
        toast({
          title: "Level Up!",
          description: `Congratulations! You've reached level ${newLevel}!`
        });
      }

      toast({
        title: "Points earned!",
        description: `+${points} points for ${reason}`
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`gamification_${user.id}`);
      fetchGamificationData();
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const addBadge = async (badge: string) => {
    if (!user || !gamificationData) return;

    try {
      const newBadges = [...gamificationData.badges, badge];

      const { error } = await supabase
        .from('gamification')
        .update({
          badges: newBadges,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "New Badge Earned!",
        description: `You've earned the "${badge}" badge!`
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`gamification_${user.id}`);
      fetchGamificationData();
    } catch (error) {
      console.error('Error adding badge:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGamificationData();
    }
  }, [user]);

  return {
    gamificationData,
    isLoading,
    addPoints,
    addBadge,
    refetch: fetchGamificationData
  };
};
