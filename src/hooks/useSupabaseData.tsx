
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DatabaseStats {
  totalUsers: number;
  totalResources: number;
  totalStudyGroups: number;
  totalMessages: number;
  userProgress: number;
}

export const useSupabaseData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DatabaseStats>({
    totalUsers: 0,
    totalResources: 0,
    totalStudyGroups: 0,
    totalMessages: 0,
    userProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardStats = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch real data from multiple tables
      const [
        { count: usersCount },
        { count: resourcesCount },
        { count: studyGroupsCount },
        { count: messagesCount },
        { data: userProgressData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('resources').select('*', { count: 'exact', head: true }),
        supabase.from('study_groups').select('*', { count: 'exact', head: true }),
        supabase.from('direct_messages').select('*', { count: 'exact', head: true }),
        supabase.from('user_progress').select('progress_percentage').eq('user_id', user.id)
      ]);

      const avgProgress = userProgressData?.length > 0 
        ? Math.round(userProgressData.reduce((sum, item) => sum + (item.progress_percentage || 0), 0) / userProgressData.length)
        : 0;

      setStats({
        totalUsers: usersCount || 0,
        totalResources: resourcesCount || 0,
        totalStudyGroups: studyGroupsCount || 0,
        totalMessages: messagesCount || 0,
        userProgress: avgProgress
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error loading dashboard data",
        description: "Unable to fetch real-time statistics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  return { stats, isLoading, refetch: fetchDashboardStats };
};
