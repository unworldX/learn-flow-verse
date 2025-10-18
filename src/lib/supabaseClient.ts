/**
 * Enhanced Supabase Client with Offline Support
 * Wraps the base Supabase client with:
 * - Connection status monitoring
 * - Realtime subscription management
 * - Offline queue handling
 * - Automatic retry logic
 */

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { syncQueueHelpers } from './dexieDB';

const env = import.meta.env;

// Configuration
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

// Validate environment
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[supabaseClient] ❌ CRITICAL: Missing Supabase credentials');
  console.error('[supabaseClient] Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env');
}

/**
 * Enhanced Supabase Client Class
 */
class EnhancedSupabaseClient {
  private client: SupabaseClient<Database>;
  private channels: Map<string, RealtimeChannel> = new Map();
  private isOnline: boolean = navigator.onLine;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private statusListeners: Set<(status: boolean) => void> = new Set();

  constructor() {
    // Create base client
    this.client = createClient<Database>(SUPABASE_URL ?? '', SUPABASE_KEY ?? '', {
      global: {
        headers: {
          'Accept': 'application/json'
        }
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    this.setupConnectionMonitoring();
    this.setupVisibilityHandler();
  }

  /**
   * Get the underlying Supabase client
   */
  get base(): SupabaseClient<Database> {
    return this.client;
  }

  /**
   * Setup network status monitoring
   */
  private setupConnectionMonitoring(): void {
    window.addEventListener('online', () => {
      console.log('[supabaseClient] ✅ Connection restored');
      this.isOnline = true;
      this.reconnectAttempts = 0;
      this.notifyStatusListeners(true);
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      console.log('[supabaseClient] ⚠️ Connection lost - entering offline mode');
      this.isOnline = false;
      this.notifyStatusListeners(false);
    });
  }

  /**
   * Setup visibility change handler for tab switching
   */
  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        console.log('[supabaseClient] 👁️ Tab became visible - checking connection');
        this.refreshConnection();
      }
    });
  }

  /**
   * Refresh connection and process pending operations
   */
  private async refreshConnection(): Promise<void> {
    try {
      // Test connection with a simple query
      const { error } = await (this.client as any).from('users').select('id').limit(1).maybeSingle();
      
      if (!error) {
        console.log('[supabaseClient] ✅ Connection verified');
        this.processOfflineQueue();
      }
    } catch (error) {
      console.error('[supabaseClient] ❌ Connection check failed:', error);
    }
  }

  /**
   * Process offline queue
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const pending = await syncQueueHelpers.getPending();
      console.log(`[supabaseClient] 📤 Processing ${pending.length} pending operations`);

      for (const item of pending) {
        try {
          await this.executeSyncOperation(item);
          await syncQueueHelpers.remove(item.id);
        } catch (error) {
          console.error('[supabaseClient] ❌ Sync operation failed:', error);
          await syncQueueHelpers.incrementRetry(
            item.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    } catch (error) {
      console.error('[supabaseClient] ❌ Failed to process offline queue:', error);
    }
  }

  /**
   * Execute a sync operation from the queue
   */
  private async executeSyncOperation(item: any): Promise<void> {
    const { entity_type, operation, payload, entity_id } = item;

    switch (operation) {
      case 'CREATE':
        await this.client.from(entity_type as any).insert(payload);
        break;
      case 'UPDATE':
        await this.client.from(entity_type as any).update(payload).eq('id', entity_id);
        break;
      case 'DELETE':
        await this.client.from(entity_type as any).delete().eq('id', entity_id);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.statusListeners.add(callback);
    // Call immediately with current status
    callback(this.isOnline);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Notify all status listeners
   */
  private notifyStatusListeners(isOnline: boolean): void {
    this.statusListeners.forEach(callback => callback(isOnline));
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to realtime changes
   */
  subscribe(
    channelName: string,
    config: {
      event: string;
      schema: string;
      table: string;
      filter?: string;
    },
    callback: (payload: any) => void
  ): RealtimeChannel {
    // Clean up existing channel
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: config.event,
          schema: config.schema,
          table: config.table,
          filter: config.filter
        },
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[supabaseClient] ✅ Subscribed to ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[supabaseClient] ❌ Channel error: ${channelName}`);
          this.handleReconnect(channelName, config, callback);
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(
    channelName: string,
    config: any,
    callback: (payload: any) => void
  ): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[supabaseClient] ❌ Max reconnect attempts reached for ${channelName}`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[supabaseClient] 🔄 Reconnecting ${channelName} in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.subscribe(channelName, config, callback);
    }, delay);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      console.log(`[supabaseClient] 👋 Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    console.log(`[supabaseClient] 👋 Unsubscribing from ${this.channels.size} channels`);
    this.channels.forEach((channel, name) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }

  /**
   * Perform a query with automatic offline handling
   */
  async query<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
    if (!this.isOnline) {
      return {
        data: null,
        error: new Error('No internet connection. Changes will be synced when online.'),
        fromCache: true
      };
    }

    try {
      const result = await queryFn();
      return result;
    } catch (error) {
      console.error('[supabaseClient] Query error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Query failed')
      };
    }
  }

  /**
   * Batch queries with rate limiting
   */
  async batchQuery<T>(
    queries: Array<() => Promise<{ data: T | null; error: any }>>,
    batchSize: number = 5
  ): Promise<Array<{ data: T | null; error: any }>> {
    const results: Array<{ data: T | null; error: any }> = [];

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(query => this.query(query))
      );
      results.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < queries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await (this.client as any).from('users').select('id').limit(1).maybeSingle();
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Get realtime channel status
   */
  getChannelStatus(): Map<string, string> {
    const status = new Map<string, string>();
    this.channels.forEach((channel, name) => {
      status.set(name, channel.state);
    });
    return status;
  }
}

// Create singleton instance
const enhancedClient = new EnhancedSupabaseClient();

// Export both the enhanced client and the base client
export const supabaseClient = enhancedClient;
export const supabase = enhancedClient.base;

// Export connection status hook
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = React.useState(enhancedClient.getConnectionStatus());

  React.useEffect(() => {
    const unsubscribe = enhancedClient.onStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
};

export default supabase;

// Add React import for the hook
import React from 'react';
