import { supabase } from '@/integrations/supabase/client';

interface CacheEntry {
  url: string;
  expiresAt: number; // epoch ms
}

const cache = new Map<string, CacheEntry>();

export interface SignedUrlOptions {
  /** Lifetime to request for the signed URL (seconds). Default 3600 (1h). */
  lifetimeSeconds?: number;
  /** Minimum remaining lifetime to consider cache hit (seconds). Default 10s. */
  freshnessThresholdSeconds?: number;
  /** Force bypass cache */
  force?: boolean;
}

export async function getSignedUrl(
  bucket: string,
  objectPath: string,
  opts: SignedUrlOptions = {}
): Promise<string> {
  const lifetime = opts.lifetimeSeconds ?? 3600;
  const threshold = opts.freshnessThresholdSeconds ?? 10;
  const now = Date.now();

  const trimmed = objectPath.trim().replace(/^\/+/, '');
  const normalized = trimmed.replace(/^uploads\//, '');
  const baseKey = `${bucket}:${normalized}`;

  const candidates = Array.from(
    new Set(
      [normalized, trimmed]
        .concat(normalized.startsWith('uploads/') ? [] : [`uploads/${normalized}`])
        .concat(normalized.startsWith('public/uploads/') ? [] : [`public/uploads/${normalized}`])
        .map(path => path.replace(/^\/+/, ''))
    )
  );

  // 1) Check cache for any candidate
  if (!opts.force) {
    for (const candidate of candidates) {
      const key = `${bucket}:${candidate}`;
      const entry = cache.get(key);
      if (entry && entry.expiresAt - now > threshold * 1000) {
        if (key !== baseKey) {
          cache.set(baseKey, entry);
        }
        return entry.url;
      }
    }
  }

  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(candidate, lifetime);

      if (error) {
        lastError = error;
        continue;
      }
      if (!data?.signedUrl) {
        lastError = new Error('No signedUrl returned');
        continue;
      }

      const entry: CacheEntry = { url: data.signedUrl, expiresAt: now + lifetime * 1000 };
      const key = `${bucket}:${candidate}`;
      cache.set(key, entry);
      cache.set(baseKey, entry);
      return data.signedUrl;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error('Failed to generate signed URL');
}

export function clearSignedUrlCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
