
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cacheService } from '@/lib/cacheService';

export interface FileUpload {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  upload_date: string;
  uploader_id: string;
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
      
      // Try cache first
      let cachedUploads = await cacheService.get<FileUpload[]>(cacheKey);
      if (cachedUploads) {
        setUploads(cachedUploads);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('uploader_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      setUploads(data || []);
      await cacheService.set(cacheKey, data || [], { ttlMinutes: 5 });
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your uploads",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File, metadata: {
    title: string;
    description?: string;
    author?: string;
    subject?: string;
    class?: string;
    resourceType?: string;
  }) => {
    if (!user) return false;

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Record upload in database
      const { data: fileData, error: fileError } = await supabase
        .from('file_uploads')
        .insert({
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          file_type: file.type,
          uploader_id: user.id
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // Create resource entry
      const { error: resourceError } = await supabase
        .from('resources')
        .insert({
          title: metadata.title,
          description: metadata.description || '',
          author: metadata.author || 'Unknown',
          subject: metadata.subject || 'General',
          class: metadata.class || 'N/A',
          resource_type: metadata.resourceType || 'Document',
          file_url: uploadData.path,
          uploader_id: user.id,
          offline_access: true,
          download_count: 0,
          premium_content: false
        });

      if (resourceError) throw resourceError;

      toast({
        title: "Upload successful",
        description: "Your file has been uploaded and is now available in resources"
      });

      // Invalidate relevant caches
      await cacheService.invalidate(`file_uploads_${user.id}`);
      await cacheService.invalidate('resources_');

      await fetchUploads();
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload your file. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (uploadId: string, filePath: string) => {
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
        .eq('id', uploadId)
        .eq('uploader_id', user.id);

      if (dbError) throw dbError;

      // Delete associated resource
      await supabase
        .from('resources')
        .delete()
        .eq('file_url', filePath)
        .eq('uploader_id', user.id);

      toast({
        title: "File deleted",
        description: "Your file has been successfully deleted"
      });

      // Invalidate caches
      await cacheService.invalidate(`file_uploads_${user.id}`);
      await cacheService.invalidate('resources_');

      await fetchUploads();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the file",
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
