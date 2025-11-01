import { supabase } from "@/integrations/supabase/client";
import { AttachmentType } from "@/types/chat";

export interface UploadedFile {
  url: string;
  thumbnailUrl?: string;
  type: AttachmentType;
  fileName: string;
  fileSize: string;
  durationSeconds?: number;
}

export type UploadProgressCallback = (progress: number) => void;

const getAttachmentType = (mimeType: string): AttachmentType => {
  if (mimeType.startsWith('image/')) {
    if (mimeType === 'image/gif') return 'gif';
    return 'image';
  }
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

const generateThumbnail = async (file: File): Promise<Blob | null> => {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return null;
  }

  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        }, 'image/jpeg', 0.3);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      
      img.src = url;
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadeddata = () => {
        video.currentTime = 1;
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        }, 'image/jpeg', 0.3);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      
      video.src = url;
    }
  });
};

export const uploadChatFile = async (
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadedFile> => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const bucket = 'chat-media';
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `${user.id}/${timestamp}.${fileExt}`;

  // Generate thumbnail if it's an image or video
  let thumbnailUrl: string | undefined;
  const thumbnailBlob = await generateThumbnail(file);
  
  if (thumbnailBlob) {
    onProgress?.(10);
    const thumbFileName = `${user.id}/${timestamp}_thumb.jpg`;
    const { data: thumbData } = await supabase.storage
      .from(bucket)
      .upload(thumbFileName, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (thumbData) {
      const { data: thumbUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(thumbData.path);
      thumbnailUrl = thumbUrlData.publicUrl;
    }
  }

  onProgress?.(30);

  // Upload full file with progress simulation
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  onProgress?.(90);

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  onProgress?.(100);

  return {
    url: urlData.publicUrl,
    thumbnailUrl,
    type: getAttachmentType(file.type),
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
  };
};

export const uploadMultipleFiles = async (
  files: FileList | File[],
  onProgress?: UploadProgressCallback
): Promise<UploadedFile[]> => {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map(file => uploadChatFile(file, onProgress)));
};
