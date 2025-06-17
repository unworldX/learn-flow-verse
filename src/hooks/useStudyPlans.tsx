
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cacheService } from '@/lib/cacheService';

export interface StudyPlan {
  id: string;
  user_id: string;
  plan_name: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface StudyPlanTask {
  id: string;
  plan_id: string;
  task_name: string;
  description: string;
  due_date: string;
  is_completed: boolean;
  resource_id?: string;
  created_at: string;
}

export const useStudyPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [tasks, setTasks] = useState<StudyPlanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudyPlans = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const cacheKey = `study_plans_${user.id}`;
      
      // Try cache first
      let cachedPlans = await cacheService.get<StudyPlan[]>(cacheKey);
      if (cachedPlans) {
        setStudyPlans(cachedPlans);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStudyPlans(data || []);
      await cacheService.set(cacheKey, data || [], { ttlMinutes: 30 });
    } catch (error) {
      console.error('Error fetching study plans:', error);
      toast({
        title: "Error loading study plans",
        description: "Unable to fetch study plans from database",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async (planId: string) => {
    if (!user) return;

    try {
      const cacheKey = `study_tasks_${planId}`;
      
      // Try cache first
      let cachedTasks = await cacheService.get<StudyPlanTask[]>(cacheKey);
      if (cachedTasks) {
        setTasks(cachedTasks);
        return;
      }

      const { data, error } = await supabase
        .from('study_plan_tasks')
        .select('*')
        .eq('plan_id', planId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      setTasks(data || []);
      await cacheService.set(cacheKey, data || [], { ttlMinutes: 15 });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error loading tasks",
        description: "Unable to fetch tasks from database",
        variant: "destructive"
      });
    }
  };

  const createStudyPlan = async (plan: Omit<StudyPlan, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_plans')
        .insert({
          user_id: user.id,
          ...plan
        });

      if (error) throw error;

      toast({
        title: "Study plan created",
        description: "Your study plan has been created successfully"
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`study_plans_${user.id}`);
      fetchStudyPlans();
    } catch (error) {
      console.error('Error creating study plan:', error);
      toast({
        title: "Error",
        description: "Failed to create study plan",
        variant: "destructive"
      });
    }
  };

  const updateStudyPlan = async (planId: string, updates: Partial<StudyPlan>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_plans')
        .update(updates)
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Study plan updated",
        description: "Your changes have been saved"
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`study_plans_${user.id}`);
      fetchStudyPlans();
    } catch (error) {
      console.error('Error updating study plan:', error);
      toast({
        title: "Error",
        description: "Failed to update study plan",
        variant: "destructive"
      });
    }
  };

  const deleteStudyPlan = async (planId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Study plan deleted",
        description: "Study plan has been removed"
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`study_plans_${user.id}`);
      await cacheService.invalidate(`study_tasks_${planId}`);
      fetchStudyPlans();
    } catch (error) {
      console.error('Error deleting study plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete study plan",
        variant: "destructive"
      });
    }
  };

  const createTask = async (task: Omit<StudyPlanTask, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('study_plan_tasks')
        .insert(task);

      if (error) throw error;

      toast({
        title: "Task created",
        description: "Task has been added to your study plan"
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`study_tasks_${task.plan_id}`);
      fetchTasks(task.plan_id);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<StudyPlanTask>) => {
    try {
      const { error } = await supabase
        .from('study_plan_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      // Find the task to get plan_id for cache invalidation
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await cacheService.invalidate(`study_tasks_${task.plan_id}`);
        fetchTasks(task.plan_id);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudyPlans();
    }
  }, [user]);

  return {
    studyPlans,
    tasks,
    isLoading,
    createStudyPlan,
    updateStudyPlan,
    deleteStudyPlan,
    createTask,
    updateTask,
    fetchTasks,
    refetch: fetchStudyPlans
  };
};
