
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Resource {
  id: string;
  title: string;
  description: string;
  author: string;
  subject: string;
  class: string;
  resource_type: string;
  file_url: string;
  upload_date: string;
  uploader_id: string;
  offline_access: boolean;
}

export const useRealResources = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    resourceType: '',
    search: ''
  });

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('resources')
        .select('*')
        .order('upload_date', { ascending: false });

      // Apply filters
      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error loading resources",
        description: "Unable to fetch resources from database",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToFavorites = async (resourceId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, resource_id: resourceId });

      if (error) throw error;

      toast({
        title: "Added to favorites",
        description: "Resource has been added to your favorites"
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: "Error",
        description: "Failed to add resource to favorites",
        variant: "destructive"
      });
    }
  };

  const updateProgress = async (resourceId: string, progress: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          resource_id: resourceId,
          progress_percentage: progress,
          last_accessed: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [filters]);

  return {
    resources,
    isLoading,
    filters,
    setFilters,
    addToFavorites,
    updateProgress,
    refetch: fetchResources
  };
};
