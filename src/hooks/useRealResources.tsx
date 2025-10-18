
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleRLSError } from '@/lib/auth';
import { useSubscription } from '@/hooks/useSubscription';
import { cacheService } from '@/lib/cacheService';
import { resolveResourceUrl } from '@/lib/utils';

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

  const normalizeResource = useCallback(
    (resource: Resource): Resource => ({
      ...resource,
      file_url: resolveResourceUrl(resource.file_url) ?? resource.file_url,
    }),
    []
  );

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const cacheKey = `resources_${JSON.stringify(filters)}`;

      // Try cache first
      const cachedResources = await cacheService.get<Resource[]>(cacheKey);
      if (cachedResources) {
        const normalisedCached = cachedResources.map(normalizeResource);
        setResources(normalisedCached);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('resources')
        .select('id, title, description, author, subject, class, resource_type, file_url, upload_date, uploader_id, offline_access, download_count, premium_content')
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

      const normalisedData = (data || []).map(normalizeResource);
      setResources(normalisedData);
      await cacheService.set(cacheKey, normalisedData, { ttlMinutes: 10 });
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error fetching resources:', error);
      toast({
        title: "Error loading resources",
        description: friendlyMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, normalizeResource, toast]);

  const downloadResource = async (resource: Resource): Promise<Resource | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to download resources",
        variant: "destructive"
      });
      return null;
    }

    // Check if premium content requires subscription
    if (resource.premium_content && !subscription?.subscribed) {
      toast({
        title: "Premium content",
        description: "This is premium content. Please upgrade your subscription.",
        variant: "destructive"
      });
      return null;
    }

    // Check download limit
    const canDownload = await checkDownloadLimit();
    if (!canDownload) {
      toast({
        title: "Download limit reached",
        description: "You have reached your download limit. Please upgrade your subscription.",
        variant: "destructive"
      });
      return null;
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

      toast({
        title: "Download started",
        description: "Your download has started successfully"
      });

      // Invalidate cache
      await cacheService.invalidate('resources_');

      return normalizeResource(resource);
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error downloading resource:', error);
      toast({
        title: "Download failed",
        description: friendlyMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  const addToFavorites = async (resourceId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ 
          user_id: user.id, 
          resource_id: resourceId 
        });

      if (error) throw error;

      toast({
        title: "Added to favorites",
        description: "Resource has been added to your favorites"
      });
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error adding to favorites:', error);
      toast({
        title: "Error",
        description: friendlyMessage,
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

  const deleteResource = async (resourceId: string) => {
    if (!user) return;

    try {
      // First, get the resource to check the file_url
      const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('file_url, uploader_id')
        .eq('id', resourceId)
        .single();

      if (fetchError) throw fetchError;

      // Check if user is the uploader
      if (resource.uploader_id !== user.id) {
        toast({
          title: "Permission denied",
          description: "You can only delete your own resources",
          variant: "destructive"
        });
        return;
      }

      // Extract the storage path from file_url
      let storagePath = resource.file_url;
      
      // Normalize the path - remove 'uploads/' prefix if present
      storagePath = storagePath.replace(/^uploads\//, '');
      
      // Try to check if file exists in storage
      const { data: fileExists } = await supabase.storage
        .from('uploads')
        .list(storagePath.substring(0, storagePath.lastIndexOf('/')), {
          search: storagePath.substring(storagePath.lastIndexOf('/') + 1)
        });

      // Delete from storage if file exists
      if (fileExists && fileExists.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('uploads')
          .remove([storagePath]);

        if (storageError) {
          console.warn('Storage delete warning:', storageError);
        }
      }

      // Always delete metadata from database (whether file exists or not)
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId)
        .eq('uploader_id', user.id); // Double-check ownership

      if (deleteError) throw deleteError;

      toast({
        title: "Resource deleted",
        description: fileExists && fileExists.length > 0 
          ? "Resource and file deleted successfully"
          : "Resource metadata deleted (file was already missing)"
      });

      // Invalidate cache and refresh
      await cacheService.invalidate('resources_');
      await fetchResources();
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error deleting resource:', error);
      toast({
        title: "Delete failed",
        description: friendlyMessage,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resources,
    isLoading,
    filters,
    setFilters,
    downloadResource,
    addToFavorites,
    updateProgress,
    deleteResource,
    refetch: fetchResources
  };
};
