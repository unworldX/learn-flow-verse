
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cacheService } from '@/lib/cacheService';

export interface FileUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_path: string;
  upload_date: string;
  is_processed: boolean;
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchUploads = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const cacheKey = `file_uploads_${user.id}`;
      
      // Try cache first for better performance
      let cachedUploads = await cacheService.get<FileUpload[]>(cacheKey);
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
      
      // Cache for 15 minutes
      await cacheService.set(cacheKey, uploadsData, { ttlMinutes: 15 });
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error loading uploads",
        description: "Unable to fetch your uploaded files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File, metadata: {
    title: string;
    description: string;
    author: string;
    subject: string;
    class: string;
    resourceType: string;
  }) => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Create file upload record
      const { data: uploadData, error: uploadError } = await supabase
        .from('file_uploads')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: `uploads/${user.id}/${Date.now()}_${file.name}`,
          is_processed: true
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Also create a resource entry
      const { error: resourceError } = await supabase
        .from('resources')
        .insert({
          title: metadata.title,
          description: metadata.description,
          author: metadata.author,
          subject: metadata.subject,
          class: metadata.class,
          resource_type: metadata.resourceType,
          file_url: uploadData.file_path,
          uploader_id: user.id,
          premium_content: false,
          upload_date: new Date().toISOString(),
          download_count: 0
        });

      if (resourceError) throw resourceError;

      toast({
        title: "File uploaded successfully",
        description: "Your file has been uploaded and is now available as a resource"
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`file_uploads_${user.id}`);
      await fetchUploads();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (uploadId: string, filePath: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', uploadId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "File deleted",
        description: "File has been deleted successfully"
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`file_uploads_${user.id}`);
      await fetchUploads();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchUploads();
    }
  }, [user]);

  return {
    uploads,
    isLoading,
    isUploading,
    uploadFile,
    deleteFile,
    refetch: fetchUploads
  };
};
