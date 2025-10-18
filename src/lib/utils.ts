import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
const PROTOCOL_RELATIVE_REGEX = /^\/\//;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveResourceUrl(fileUrl?: string | null): string | null {
  if (!fileUrl) return null;
  if (ABSOLUTE_URL_REGEX.test(fileUrl)) {
    return fileUrl;
  }
  if (PROTOCOL_RELATIVE_REGEX.test(fileUrl)) {
    return `https:${fileUrl}`;
  }

  const trimmed = fileUrl.replace(/^\/+/, "");
  const env = import.meta.env;
  const base = (env.VITE_RESOURCE_BASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '');

  if (base) {
    // If already looks like a full storage path keep it
    if (trimmed.startsWith('storage/v1/object/')) {
      return `${base}/${trimmed}`;
    }
    // If begins with storage/ but missing v1/object, allow passthrough
    if (trimmed.startsWith('storage/')) {
      return `${base}/${trimmed}`;
    }
    // If path already includes a bucket prefix (heuristic: first segment contains a dash or uuid-like) we still
    // normalize by adding public access level.
    return `${base}/storage/v1/object/public/${trimmed}`;
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
    try {
      return new URL(fileUrl, window.location.origin).toString();
    } catch (_) {
      // ignore and fall back
    }
  }

  return fileUrl;
}

export type SupabaseAccessLevel = 'public' | 'authenticated' | 'private' | 'sign' | 'other';

export interface SupabaseStorageInfo {
  bucket: string;
  path: string;
  accessLevel: SupabaseAccessLevel;
}

export function parseSupabaseStorageUrl(fileUrl?: string | null): SupabaseStorageInfo | null {
  if (!fileUrl) return null;

  const resolved = resolveResourceUrl(fileUrl);
  if (!resolved) return null;

  try {
    const url = new URL(resolved, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const pathSegments = url.pathname.split('/').filter(Boolean);

    const storageIndex = pathSegments.indexOf('storage');
    if (storageIndex === -1) return null;

    const objectIndex = pathSegments.indexOf('object', storageIndex);
    if (objectIndex === -1) return null;

    const accessLevel = (pathSegments[objectIndex + 1] ?? 'other') as SupabaseAccessLevel;
    const bucket = pathSegments[objectIndex + 2];
    if (!bucket) return null;

    const objectPathSegments = pathSegments.slice(objectIndex + 3);
    if (!objectPathSegments.length) return null;

    const path = objectPathSegments.join('/');

    return {
      bucket,
      path,
      accessLevel,
    };
  } catch (error) {
    console.warn('Failed to parse Supabase storage URL', error);
    return null;
  }
}
// Media/file detection helpers for chat
const IMAGE_EXT = ['png','jpg','jpeg','gif','webp','bmp','svg'];
const VIDEO_EXT = ['mp4','webm','mov','m4v'];
const DOC_EXT = ['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','csv'];

export interface ExtractedFileRef {
  url: string;
  filename?: string;
  ext?: string;
  kind: 'image' | 'video' | 'doc' | 'other';
}

const urlRegex = /(https?:\/\/[^\s)]+)|(\b\w+\/[^\s)]+\.(?:png|jpg|jpeg|gif|webp|bmp|svg|mp4|webm|mov|m4v|pdf|docx?|pptx?|xlsx?|txt|csv))?/gi;

export function extractFilesFromText(text: string): ExtractedFileRef[] {
  if (!text) return [];
  const matches = Array.from(text.matchAll(urlRegex)).map(m => m[0]).filter(Boolean) as string[];
  const unique = Array.from(new Set(matches));
  return unique.map(url => {
    const clean = url.replace(/[.,;!?)]*$/, '');
    const parts = clean.split(/[?#]/)[0].split('/');
    const filename = parts[parts.length - 1];
    const ext = (filename.split('.').pop() || '').toLowerCase();
    let kind: ExtractedFileRef['kind'] = 'other';
    if (IMAGE_EXT.includes(ext)) kind = 'image';
    else if (VIDEO_EXT.includes(ext)) kind = 'video';
    else if (DOC_EXT.includes(ext)) kind = 'doc';
    return { url: clean, filename, ext, kind };
  });
}

export function partitionMedia(refs: ExtractedFileRef[]) {
  const images: ExtractedFileRef[] = [];
  const videos: ExtractedFileRef[] = [];
  const docs: ExtractedFileRef[] = [];
  const others: ExtractedFileRef[] = [];
  refs.forEach(r => {
    if (r.kind === 'image') images.push(r);
    else if (r.kind === 'video') videos.push(r);
    else if (r.kind === 'doc') docs.push(r);
    else others.push(r);
  });
  return { images, videos, docs, others };
}
