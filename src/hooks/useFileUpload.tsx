import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { handleRLSError } from "@/lib/auth";
import { cacheService } from "@/lib/cacheService";

export interface FileUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_path: string; // Storage path
  upload_date: string;
  is_processed: boolean;
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch existing uploads
  const fetchUploads = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const cacheKey = `file_uploads_${user.id}`;
      const cachedUploads = await cacheService.get<FileUpload[]>(cacheKey);

      if (cachedUploads) {
        setUploads(cachedUploads);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("file_uploads")
        .select("id, user_id, file_name, file_type, file_size, file_path, upload_date, is_processed")
        .eq("user_id", user.id)
        .order("upload_date", { ascending: false });

      if (error) throw error;

      const uploadsData = data || [];
      setUploads(uploadsData);

      await cacheService.set(cacheKey, uploadsData, { ttlMinutes: 15 });
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error("Error fetching uploads:", error);
      toast({
        title: "Error loading uploads",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Upload file to Supabase Storage & insert metadata
  const uploadFile = async (
    file: File,
    metadata: {
      title: string;
      description: string;
      author: string;
      subject: string;
      class: string;
      resourceType: string;
    }
  ) => {
    if (!user) return;
    setIsUploading(true);

    try {
      // Allowed file types
      const allowed = ["txt", "pdf", "doc", "docx"];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !allowed.includes(ext)) {
        toast({
          title: "Unsupported file",
          description: "Only .txt, .pdf, .doc, .docx are allowed",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Generate unique storage object path (objectPath is relative inside the bucket)
      const timestamp = Date.now();
      const objectPath = `${user.id}/${timestamp}_${file.name}`; // correct relative path
      const storedPath = `uploads/${objectPath}`; // legacy pattern kept for DB/file_url consistency

      // 1️⃣ Upload file to Supabase Storage (bucket already named 'uploads')
      const { error: storageError } = await supabase.storage
        .from("uploads")
        .upload(objectPath, file, { cacheControl: "3600", upsert: false });

      if (storageError) throw storageError;

      // 2️⃣ Insert metadata into file_uploads table
      const { data: uploadData, error: uploadError } = await supabase
        .from("file_uploads")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: storedPath, // Persist with bucket prefix for backward compatibility
          is_processed: true,
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // 3️⃣ Insert resource record
      const { error: resourceError } = await supabase.from("resources").insert({
        title: metadata.title,
        description: metadata.description,
        author: metadata.author,
        subject: metadata.subject,
        class: metadata.class,
        resource_type: metadata.resourceType,
  file_url: storedPath, // Stored with bucket prefix (viewer normalizes duplicates)
        uploader_id: user.id,
        premium_content: false,
        upload_date: new Date().toISOString(),
        download_count: 0,
      });

      if (resourceError) throw resourceError;

      toast({
        title: "File uploaded successfully",
        description: "Your file is now available as a resource",
      });

      await cacheService.invalidate(`file_uploads_${user.id}`);
      await fetchUploads();
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file
  const deleteFile = async (uploadId: string, filePath: string) => {
    if (!user) return;

    try {
      // 1️⃣ Delete metadata from DB
      const { error } = await supabase
        .from("file_uploads")
        .delete()
        .eq("id", uploadId)
        .eq("user_id", user.id);

      if (error) throw error;

      // 2️⃣ Delete file from Storage (sanitize legacy prefixed paths)
      let objectPath = filePath.replace(/^uploads\//, "");
      objectPath = objectPath.replace(/^uploads\//, ""); // double-prefix safety
      const { error: storageError } = await supabase.storage
        .from("uploads")
        .remove([objectPath]);

      if (storageError) console.warn("Storage delete warning:", storageError);

      toast({
        title: "File deleted",
        description: "File has been deleted successfully",
      });

      await cacheService.invalidate(`file_uploads_${user.id}`);
      await fetchUploads();
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error("Error deleting file:", error);
      toast({
        title: "Delete failed",
        description: friendlyMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) fetchUploads();
  }, [user, fetchUploads]);

  return {
    uploads,
    isLoading,
    isUploading,
    uploadFile,
    deleteFile,
    refetch: fetchUploads,
  };
};
