
interface CacheItem<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheOptions {
  ttlMinutes?: number;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL_MINUTES = 30;

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttlMinutes = options.ttlMinutes || this.DEFAULT_TTL_MINUTES;
    const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
    
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now()
    });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  // Clean up expired items
  private cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    
    keys.forEach(key => {
      const item = this.cache.get(key);
      if (item && now > item.expiresAt) {
        this.cache.delete(key);
      }
    });
  }

  constructor() {
    // Run cleanup every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
}

export const cacheService = new CacheService();
