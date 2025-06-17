
import { supabase } from '@/integrations/supabase/client';

interface CacheOptions {
  ttlMinutes?: number;
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache = new Map<string, { data: any; expires: number }>();

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expires > Date.now()) {
      console.log(`Cache hit (memory): ${key}`);
      return memoryItem.data as T;
    }

    // Check database cache
    try {
      const { data, error } = await supabase.rpc('get_cache', { cache_key_param: key });
      if (error) throw error;

      if (data) {
        console.log(`Cache hit (database): ${key}`);
        // Store in memory cache for faster access
        this.memoryCache.set(key, {
          data,
          expires: Date.now() + (5 * 60 * 1000) // 5 minutes in memory
        });
        return data as T;
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }

    console.log(`Cache miss: ${key}`);
    return null;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttlMinutes = 60 } = options;

    try {
      // Store in database cache - convert to JSON-compatible format
      const jsonValue = JSON.parse(JSON.stringify(value));
      
      await supabase.rpc('set_cache', {
        cache_key_param: key,
        cache_value_param: jsonValue,
        ttl_minutes: ttlMinutes
      });

      // Store in memory cache
      this.memoryCache.set(key, {
        data: value,
        expires: Date.now() + (Math.min(ttlMinutes, 5) * 60 * 1000)
      });

      console.log(`Cache set: ${key} (TTL: ${ttlMinutes}m)`);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from database cache (simplified approach)
    try {
      await supabase.rpc('cleanup_expired_cache');
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }
}

export const cacheService = CacheService.getInstance();
