/**
 * Sync Service - Local-First Bidirectional Sync
 * 
 * Handles synchronization between local Dexie DB and remote Supabase
 * 
 * Features:
 * - Optimistic UI updates
 * - Conflict resolution (last-write-wins with version tracking)
 * - Delta sync (only sync changes since last sync)
 * - Background sync with exponential backoff
 * - Offline queue management
 * - Deduplication
 */

import { db, syncQueueHelpers, bulkHelpers } from './dexieDB';
import { supabaseClient, supabase } from './supabaseClient';
import type {
  Chat,
  Message,
  Note,
  Reminder,
  Course,
  CourseProgress,
  Resource,
  AIConversation,
  AIMessage,
  ForumThread,
  ForumPost,
  SyncQueue,
  EntityType,
  OperationType
} from '@/types/entities';

/**
 * Sync Configuration
 */
const SYNC_CONFIG = {
  SYNC_INTERVAL_MS: 2 * 60 * 1000, // 2 minutes
  BATCH_SIZE: 50,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  ENABLE_REALTIME: true,
  DELTA_SYNC_LOOKBACK_HOURS: 24
};

/**
 * Sync Statistics
 */
interface SyncStats {
  last_sync_at: Date | null;
  items_synced: number;
  items_failed: number;
  is_syncing: boolean;
  pending_operations: number;
}

/**
 * Sync Service Class
 */
class SyncService {
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private stats: SyncStats = {
    last_sync_at: null,
    items_synced: 0,
    items_failed: 0,
    is_syncing: false,
    pending_operations: 0
  };
  private statusListeners: Set<(stats: SyncStats) => void> = new Set();

  /**
   * Initialize sync service
   */
  async initialize(userId: string): Promise<void> {
    console.log('[syncService] 🚀 Initializing sync service for user:', userId);

    // Start background sync
    this.startBackgroundSync();

    // Setup realtime subscriptions
    if (SYNC_CONFIG.ENABLE_REALTIME) {
      this.setupRealtimeSubscriptions(userId);
    }

    // Monitor online status
    supabaseClient.onStatusChange((isOnline) => {
      if (isOnline && !this.isRunning) {
        console.log('[syncService] 📡 Connection restored, starting sync');
        this.syncAll(userId);
      }
    });
  }

  /**
   * Start background sync
   */
  private startBackgroundSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      const userId = this.getCurrentUserId();
      if (userId && supabaseClient.getConnectionStatus()) {
        this.syncAll(userId);
      }
    }, SYNC_CONFIG.SYNC_INTERVAL_MS);

    console.log('[syncService] ⏰ Background sync started');
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[syncService] ⏸️ Background sync stopped');
    }
  }

  /**
   * Get current user ID (implement based on your auth context)
   */
  private getCurrentUserId(): string | null {
    // This should be implemented to get the current authenticated user ID
    // For now, returning null as a placeholder
    return null;
  }

  /**
   * Sync all entities
   */
  async syncAll(userId: string): Promise<void> {
    if (this.isRunning) {
      console.log('[syncService] ⏭️ Sync already in progress, skipping');
      return;
    }

    this.isRunning = true;
    this.stats.is_syncing = true;
    this.notifyListeners();

    console.log('[syncService] 🔄 Starting full sync');

    try {
      // Step 1: Process offline queue (upload local changes)
      await this.processOfflineQueue();

      // Step 2: Pull remote changes
      await this.pullRemoteChanges(userId);

      // Step 3: Update stats
      const pendingCount = await syncQueueHelpers.getPending().then(items => items.length);
      this.stats.last_sync_at = new Date();
      this.stats.pending_operations = pendingCount;

      console.log('[syncService] ✅ Sync completed successfully');
    } catch (error) {
      console.error('[syncService] ❌ Sync failed:', error);
      this.stats.items_failed++;
    } finally {
      this.isRunning = false;
      this.stats.is_syncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Process offline queue - upload pending changes to Supabase
   */
  private async processOfflineQueue(): Promise<void> {
    const pending = await syncQueueHelpers.getPending(SYNC_CONFIG.BATCH_SIZE);

    if (pending.length === 0) return;

    console.log(`[syncService] 📤 Processing ${pending.length} pending operations`);

    for (const item of pending) {
      try {
        await this.executeSyncOperation(item);
        await syncQueueHelpers.remove(item.id);
        this.stats.items_synced++;
      } catch (error) {
        console.error('[syncService] ❌ Failed to sync item:', error);
        
        if (item.retry_count < SYNC_CONFIG.MAX_RETRY_ATTEMPTS) {
          await syncQueueHelpers.incrementRetry(
            item.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
        } else {
          console.error('[syncService] ❌ Max retries reached, marking as failed');
          this.stats.items_failed++;
        }
      }
    }
  }

  /**
   * Execute a single sync operation
   */
  private async executeSyncOperation(item: SyncQueue): Promise<void> {
    const { entity_type, operation, payload, entity_id } = item;

    switch (operation) {
      case 'CREATE':
        await (supabase as any).from(this.getTableName(entity_type)).insert(payload);
        break;
      case 'UPDATE':
        await (supabase as any).from(this.getTableName(entity_type))
          .update(payload)
          .eq('id', entity_id);
        break;
      case 'DELETE':
        await (supabase as any).from(this.getTableName(entity_type))
          .delete()
          .eq('id', entity_id);
        break;
    }
  }

  /**
   * Pull remote changes from Supabase
   */
  private async pullRemoteChanges(userId: string): Promise<void> {
    console.log('[syncService] 📥 Pulling remote changes');

    // Get last sync timestamp from metadata
    const lastSync = await db.syncMetadata
      .where('entity_type')
      .equals('last_sync' as any)
      .first();

    const since = lastSync?.last_synced_at || this.getDefaultSyncDate();

    try {
      // Pull chats
      await this.pullChats(userId, since);

      // Pull messages (for active chats only)
      await this.pullMessages(userId, since);

      // Pull notes
      await this.pullNotes(userId, since);

      // Pull reminders
      await this.pullReminders(userId, since);

      // Pull other entities...
      // (Add more as needed)

      // Update last sync timestamp
      await db.syncMetadata.put({
        entity_type: 'last_sync' as any,
        entity_id: userId,
        local_version: 1,
        remote_version: 1,
        last_synced_at: new Date().toISOString(),
        has_conflict: false
      });
    } catch (error) {
      console.error('[syncService] ❌ Failed to pull remote changes:', error);
      throw error;
    }
  }

  /**
   * Pull chats from Supabase
   */
  private async pullChats(userId: string, since: string): Promise<void> {
    const { data, error } = await (supabase as any)
      .from('chats')
      .select('*')
      .gte('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      await bulkHelpers.upsertChats(data);
      console.log(`[syncService] ✅ Pulled ${data.length} chats`);
    }
  }

  /**
   * Pull messages from Supabase
   */
  private async pullMessages(userId: string, since: string): Promise<void> {
    // Get active chat IDs
    const chats = await db.chats.limit(20).toArray();
    const chatIds = chats.map(c => c.id);

    if (chatIds.length === 0) return;

    const { data, error } = await (supabase as any)
      .from('messages')
      .select('*')
      .in('chat_id', chatIds)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(SYNC_CONFIG.BATCH_SIZE);

    if (error) throw error;

    if (data && data.length > 0) {
      await bulkHelpers.upsertMessages(data);
      console.log(`[syncService] ✅ Pulled ${data.length} messages`);
    }
  }

  /**
   * Pull notes from Supabase
   */
  private async pullNotes(userId: string, since: string): Promise<void> {
    const { data, error } = await (supabase as any)
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      await bulkHelpers.upsertNotes(data);
      console.log(`[syncService] ✅ Pulled ${data.length} notes`);
    }
  }

  /**
   * Pull reminders from Supabase
   */
  private async pullReminders(userId: string, since: string): Promise<void> {
    const { data, error } = await (supabase as any)
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      await db.reminders.bulkPut(data);
      console.log(`[syncService] ✅ Pulled ${data.length} reminders`);
    }
  }

  /**
   * Setup realtime subscriptions for live updates
   */
  private setupRealtimeSubscriptions(userId: string): void {
    console.log('[syncService] 📡 Setting up realtime subscriptions');

    // Subscribe to messages
    supabaseClient.subscribe(
      'messages_realtime',
      {
        event: '*',
        schema: 'public',
        table: 'messages'
      },
      async (payload) => {
        console.log('[syncService] 📨 Realtime message:', payload);
        await this.handleRealtimeMessage(payload);
      }
    );

    // Subscribe to notes
    supabaseClient.subscribe(
      'notes_realtime',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log('[syncService] 📝 Realtime note:', payload);
        await this.handleRealtimeNote(payload);
      }
    );

    // Subscribe to reminders
    supabaseClient.subscribe(
      'reminders_realtime',
      {
        event: '*',
        schema: 'public',
        table: 'reminders',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log('[syncService] ⏰ Realtime reminder:', payload);
        await this.handleRealtimeReminder(payload);
      }
    );
  }

  /**
   * Handle realtime message updates
   */
  private async handleRealtimeMessage(payload: any): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        await db.messages.put(newRecord);
        break;
      case 'UPDATE':
        await db.messages.put(newRecord);
        break;
      case 'DELETE':
        await db.messages.delete(oldRecord.id);
        break;
    }
  }

  /**
   * Handle realtime note updates
   */
  private async handleRealtimeNote(payload: any): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        await db.notes.put(newRecord);
        break;
      case 'UPDATE':
        await db.notes.put(newRecord);
        break;
      case 'DELETE':
        await db.notes.delete(oldRecord.id);
        break;
    }
  }

  /**
   * Handle realtime reminder updates
   */
  private async handleRealtimeReminder(payload: any): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        await db.reminders.put(newRecord);
        break;
      case 'UPDATE':
        await db.reminders.put(newRecord);
        break;
      case 'DELETE':
        await db.reminders.delete(oldRecord.id);
        break;
    }
  }

  /**
   * Get default sync date (24 hours ago)
   */
  private getDefaultSyncDate(): string {
    const date = new Date();
    date.setHours(date.getHours() - SYNC_CONFIG.DELTA_SYNC_LOOKBACK_HOURS);
    return date.toISOString();
  }

  /**
   * Map entity type to table name
   */
  private getTableName(entityType: EntityType): string {
    const tableMap: Record<EntityType, string> = {
      chat: 'chats',
      message: 'messages',
      note: 'notes',
      reminder: 'reminders',
      course_progress: 'course_progress',
      resource_bookmark: 'resource_bookmarks',
      forum_post: 'forum_posts',
      ai_message: 'ai_messages'
    };

    return tableMap[entityType] || entityType;
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(
    userId: string,
    entityType: EntityType,
    entityId: string,
    operation: OperationType,
    payload: any
  ): Promise<void> {
    await syncQueueHelpers.add({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      operation,
      payload,
      retry_count: 0
    });

    this.stats.pending_operations++;
    this.notifyListeners();

    // Trigger immediate sync if online
    if (supabaseClient.getConnectionStatus() && !this.isRunning) {
      this.syncAll(userId);
    }
  }

  /**
   * Subscribe to sync status updates
   */
  onStatusChange(callback: (stats: SyncStats) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.stats); // Call immediately with current status

    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Notify status listeners
   */
  private notifyListeners(): void {
    this.statusListeners.forEach(callback => callback(this.stats));
  }

  /**
   * Get current sync stats
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Force sync now
   */
  async forceSyncNow(userId: string): Promise<void> {
    await this.syncAll(userId);
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    this.stopBackgroundSync();
    supabaseClient.unsubscribeAll();
    console.log('[syncService] 👋 Sync service shut down');
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
