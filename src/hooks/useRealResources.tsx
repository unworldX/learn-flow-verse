
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { cacheService } from '@/lib/cacheService';

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
  download_count: number;
  premium_content: boolean;
}

export const useRealResources = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription, checkDownloadLimit, updateUsage } = useSubscription();
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
      const cacheKey = `resources_${JSON.stringify(filters)}`;
      
      // Try cache first
      let cachedResources = await cacheService.get<Resource[]>(cacheKey);
      if (cachedResources) {
        setResources(cachedResources);
        setIsLoading(false);
        return;
      }

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
      await cacheService.set(cacheKey, data || [], { ttlMinutes: 10 });
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

  const downloadResource = async (resource: Resource) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to download resources",
        variant: "destructive"
      });
      return;
    }

    // Check if premium content requires subscription
    if (resource.premium_content && !subscription?.subscribed) {
      toast({
        title: "Premium content",
        description: "This is premium content. Please upgrade your subscription.",
        variant: "destructive"
      });
      return;
    }

    // Check download limit
    const canDownload = await checkDownloadLimit();
    if (!canDownload) {
      toast({
        title: "Download limit reached",
        description: "You have reached your download limit. Please upgrade your subscription.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Record the download
      const { error } = await supabase
        .from('user_downloads')
        .insert({
          user_id: user.id,
          resource_id: resource.id
        });

      if (error && error.code !== '23505') throw error; // Ignore duplicate downloads

      // Update usage count
      await updateUsage('download');

      // Update resource download count
      await supabase
        .from('resources')
        .update({ download_count: resource.download_count + 1 })
        .eq('id', resource.id);

      // Simulate download
      if (resource.file_url) {
        window.open(resource.file_url, '_blank');
      }

      toast({
        title: "Download started",
        description: "Your download has started successfully"
      });

      // Invalidate cache
      await cacheService.invalidate('resources_');
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast({
        title: "Download failed",
        description: "Failed to download resource",
        variant: "destructive"
      });
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
    downloadResource,
    addToFavorites,
    updateProgress,
    refetch: fetchResources
  };
};
