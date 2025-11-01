import { supabase } from "@/integrations/supabase/client";
import { AttachmentType } from "@/types/chat";

export interface UploadedFile {
  url: string;
  type: AttachmentType;
  fileName: string;
  fileSize: string;
  durationSeconds?: number;
}

const getAttachmentType = (mimeType: string): AttachmentType => {
  if (mimeType.startsWith('image/')) {
    if (mimeType === 'image/gif') return 'gif';
    return 'image';
  }
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

export const uploadChatFile = async (file: File): Promise<UploadedFile> => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const bucket = 'chat-media'; // Use existing bucket
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    type: getAttachmentType(file.type),
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
  };
};

export const uploadMultipleFiles = async (files: FileList | File[]): Promise<UploadedFile[]> => {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map(uploadChatFile));
};
