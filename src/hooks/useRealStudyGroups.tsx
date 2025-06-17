
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  is_private: boolean;
  max_members: number;
  member_count?: number;
  is_member?: boolean;
}

export const useRealStudyGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription, checkGroupLimit, updateUsage } = useSubscription();
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudyGroups = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch all study groups first
      const { data: groups, error: groupsError } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch member counts separately
      const { data: memberCounts, error: countsError } = await supabase
        .from('study_group_members')
        .select('group_id')
        .then(result => {
          if (result.error) throw result.error;
          
          // Count members per group
          const counts: Record<string, number> = {};
          result.data?.forEach(member => {
            counts[member.group_id] = (counts[member.group_id] || 0) + 1;
          });
          
          return { data: counts, error: null };
        });

      if (countsError) throw countsError;

      // Fetch user's group memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('study_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (membershipsError) throw membershipsError;

      const memberGroupIds = new Set(memberships?.map(m => m.group_id) || []);

      const processedGroups = groups?.map(group => ({
        ...group,
        member_count: memberCounts?.[group.id] || 0,
        is_member: memberGroupIds.has(group.id)
      })) || [];

      setStudyGroups(processedGroups);
      setMyGroups(processedGroups.filter(group => group.is_member));
      
    } catch (error) {
      console.error('Error fetching study groups:', error);
      toast({
        title: "Error loading study groups",
        description: "Unable to fetch study groups from database",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    // Check group limit
    const canJoin = await checkGroupLimit();
    if (!canJoin) {
      toast({
        title: "Group limit reached",
        description: "You have reached your group limit. Please upgrade your subscription.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      // Update usage count
      await updateUsage('group');

      toast({
        title: "Joined group",
        description: "You have successfully joined the study group"
      });

      fetchStudyGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: "Failed to join study group",
        variant: "destructive"
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update usage count (decrease)
      await updateUsage('group', -1);

      toast({
        title: "Left group",
        description: "You have left the study group"
      });

      fetchStudyGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error",
        description: "Failed to leave study group",
        variant: "destructive"
      });
    }
  };

  const createGroup = async (groupData: {
    name: string;
    description: string;
    is_private: boolean;
    max_members: number;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('study_groups')
        .insert({
          ...groupData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator
      await supabase
        .from('study_group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'admin'
        });

      toast({
        title: "Group created",
        description: "Your study group has been created successfully"
      });

      fetchStudyGroups();
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create study group",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudyGroups();
    }
  }, [user]);

  return {
    studyGroups,
    myGroups,
    isLoading,
    joinGroup,
    leaveGroup,
    createGroup,
    refetch: fetchStudyGroups
  };
};
