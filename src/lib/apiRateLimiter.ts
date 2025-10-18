/**
 * API Rate Limiter & Request Batcher
 * Prevents API overload by batching, queuing, and rate-limiting requests
 */

interface QueuedRequest<T> {
  key: string;
  fetcher: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  priority: number;
  timestamp: number;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
}

class APIRateLimiter {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private requestsInLastMinute: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 83;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second
  private readonly MAX_RETRIES = 3;

  /**
   * Execute request with rate limiting and retries
   */
  async execute<T>(
    key: string,
    fetcher: () => Promise<T>,
    priority: number = 0,
    retries: number = 0
  ): Promise<T> {
    // Check rate limit
    if (!this.canMakeRequest()) {
      // Queue the request
      return new Promise<T>((resolve, reject) => {
        this.queue.push({
          key,
          fetcher,
          resolve,
          reject,
          priority,
          timestamp: Date.now(),
        });
        this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
        this.processQueue();
      });
    }

    // Execute immediately
    this.trackRequest();
    
    try {
      return await fetcher();
    } catch (error: any) {
      // Retry with exponential backoff
      if (retries < this.MAX_RETRIES && this.isRetryableError(error)) {
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, retries);
        console.warn(`⚠️ Retrying request ${key} in ${delay}ms (attempt ${retries + 1}/${this.MAX_RETRIES})`);
        
        await this.sleep(delay);
        return this.execute(key, fetcher, priority, retries + 1);
      }
      
      throw error;
    }
  }

  /**
   * Batch multiple similar requests into one
   */
  async batchExecute<T, R>(
    requests: Array<{ key: string; param: T }>,
    batchFetcher: (params: T[]) => Promise<R[]>,
    config: BatchConfig = { maxBatchSize: 20, maxWaitTime: 100 }
  ): Promise<R[]> {
    const batches: T[][] = [];
    
    // Split into batches
    for (let i = 0; i < requests.length; i += config.maxBatchSize) {
      batches.push(requests.slice(i, i + config.maxBatchSize).map(r => r.param));
    }

    // Execute batches
    const results: R[] = [];
    for (const batch of batches) {
      const batchResults = await this.execute(
        `batch_${batch.length}`,
        () => batchFetcher(batch),
        1 // Medium priority
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  /**
   * Throttle function calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Check if we can make a request based on rate limit
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    this.requestsInLastMinute = this.requestsInLastMinute.filter(
      t => now - t < 60000
    );
    
    return this.requestsInLastMinute.length < this.MAX_REQUESTS_PER_MINUTE;
  }

  /**
   * Track a request
   */
  private trackRequest(): void {
    this.requestsInLastMinute.push(Date.now());
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;

    while (this.queue.length > 0 && this.canMakeRequest()) {
      const request = this.queue.shift()!;
      this.trackRequest();

      try {
        const result = await request.fetcher();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Small delay between requests
      await this.sleep(50);
    }

    this.processing = false;

    // Schedule next processing if queue is not empty
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors, timeouts, 5xx errors
    const retryableCodes = [408, 429, 500, 502, 503, 504];
    return (
      error.message?.includes('network') ||
      error.message?.includes('timeout') ||
      retryableCodes.includes(error.status)
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current stats
   */
  getStats() {
    const now = Date.now();
    const recentRequests = this.requestsInLastMinute.filter(
      t => now - t < 60000
    ).length;

    return {
      queueLength: this.queue.length,
      requestsPerMin: recentRequests,
      utilizationPercent: Math.round(
        (recentRequests / this.MAX_REQUESTS_PER_MINUTE) * 100
      ),
      isProcessing: this.processing,
    };
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue.forEach(req => 
      req.reject(new Error('Queue cleared'))
    );
    this.queue = [];
  }
}

// Singleton instance
export const apiRateLimiter = new APIRateLimiter();

// Export commonly used debounced/throttled intervals
export const DebounceIntervals = {
  TYPING_INDICATOR: 500, // 500ms
  SEARCH: 300, // 300ms
  STATUS_UPDATE: 1000, // 1s
  PRESENCE: 2000, // 2s
  AUTO_SAVE: 1500, // 1.5s
} as const;

export const ThrottleIntervals = {
  SCROLL: 100, // 100ms
  RESIZE: 200, // 200ms
  MOUSE_MOVE: 50, // 50ms
} as const;
