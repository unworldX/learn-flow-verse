
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cacheService } from '@/lib/cacheService';

export interface OptimizedFileUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_path: string;
  upload_date: string;
  is_processed: boolean;
}

export const useOptimizedFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<OptimizedFileUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchUploads = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const cacheKey = `file_uploads_${user.id}`;
      
      // Try cache first
      let cachedUploads = await cacheService.get<OptimizedFileUpload[]>(cacheKey);
      if (cachedUploads) {
        setUploads(cachedUploads);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      
      const uploadsData = data || [];
      setUploads(uploadsData);
      
      // Cache for 10 minutes
      await cacheService.set(cacheKey, uploadsData, { ttlMinutes: 10 });
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error loading files",
        description: "Unable to fetch uploaded files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const uploadFile = useCallback(async (
    file: File, 
    metadata?: {
      title?: string;
      description?: string;
      author?: string;
      subject?: string;
      class?: string;
      resourceType?: string;
    }
  ) => {
    if (!user) return null;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      // Create file record
      const { data: fileRecord, error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: fileName
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Create resource entry with better integration
      if (metadata && (metadata.title || metadata.description)) {
        const { error: resourceError } = await supabase
          .from('resources')
          .insert({
            title: metadata.title || file.name,
            description: metadata.description || `Uploaded file: ${file.name}`,
            author: metadata.author || user.email,
            subject: metadata.subject || 'General',
            class: metadata.class || 'Unspecified',
            resource_type: metadata.resourceType || file.type?.split('/')[0] || 'Document',
            file_url: urlData.publicUrl,
            uploader_id: user.id
          });

        if (resourceError) {
          console.error('Error creating resource:', resourceError);
        }
      }

      // Invalidate caches to ensure fresh data
      await cacheService.invalidate(`file_uploads_${user.id}`);
      await cacheService.invalidate(`resources_${user.id}`);

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`
      });

      // Refresh uploads
      await fetchUploads();
      
      return fileRecord;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user, toast, fetchUploads]);

  const deleteFile = useCallback(async (id: string, filePath: string) => {
    if (!user) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Invalidate caches
      await cacheService.invalidate(`file_uploads_${user.id}`);
      await cacheService.invalidate(`resources_${user.id}`);

      toast({
        title: "File deleted",
        description: "File has been deleted successfully"
      });

      await fetchUploads();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  }, [user, toast, fetchUploads]);

  return {
    uploads,
    isLoading,
    isUploading,
    uploadFile,
    deleteFile,
    refetch: fetchUploads
  };
};
