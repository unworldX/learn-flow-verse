/**
 * Dexie.js Database Layer - Local-First Architecture
 * Provides offline-first storage with automatic sync to Supabase
 */

import Dexie, { Table } from 'dexie';
import type {
  Chat,
  Message,
  Note,
  Reminder,
  Course,
  CourseProgress,
  Resource,
  ResourceBookmark,
  AIConversation,
  AIMessage,
  ForumThread,
  ForumPost,
  Notification,
  SyncQueue,
  SyncMetadata,
  User,
  LessonProgress
} from '@/types/entities';

/**
 * Main Database Class
 */
export class StudentLibDB extends Dexie {
  // Chat & Messaging
  chats!: Table<Chat, string>;
  messages!: Table<Message, string>;
  
  // Notes
  notes!: Table<Note, string>;
  
  // Reminders
  reminders!: Table<Reminder, string>;
  
  // Courses
  courses!: Table<Course, string>;
  courseProgress!: Table<CourseProgress, string>;
  lessonProgress!: Table<LessonProgress, string>;
  
  // Resources
  resources!: Table<Resource, string>;
  resourceBookmarks!: Table<ResourceBookmark, string>;
  
  // AI Assistant
  aiConversations!: Table<AIConversation, string>;
  aiMessages!: Table<AIMessage, string>;
  
  // Forums
  forumThreads!: Table<ForumThread, string>;
  forumPosts!: Table<ForumPost, string>;
  
  // System
  notifications!: Table<Notification, string>;
  syncQueue!: Table<SyncQueue, string>;
  syncMetadata!: Table<SyncMetadata, string>;
  users!: Table<User, string>;

  constructor() {
    super('StudentLibDB');
    
    this.version(1).stores({
      // Chat & Messaging - Indexed by activity, type, pinned status
      chats: 'id, type, last_activity_at, is_pinned, is_archived, [is_pinned+last_activity_at]',
      messages: 'id, chat_id, sender_id, created_at, status, [chat_id+created_at], [chat_id+status]',
      
      // Notes - Indexed by tags, favorites, updated time
      notes: 'id, user_id, updated_at, is_favorite, is_pinned, [user_id+updated_at], [user_id+is_favorite], *tags',
      
      // Reminders - Indexed by remind time, status, priority
      reminders: 'id, user_id, remind_at, status, priority, [user_id+remind_at], [user_id+status], [user_id+priority], *tags',
      
      // Courses - Indexed by category, difficulty, rating
      courses: 'id, instructor_id, category, difficulty, status, rating, *tags',
      courseProgress: 'id, user_id, course_id, progress_percentage, [user_id+course_id], [user_id+progress_percentage]',
      lessonProgress: 'lesson_id, [lesson_id+user_id]',
      
      // Resources - Indexed by type, category, tags
      resources: 'id, user_id, resource_type, category, status, created_at, *tags',
      resourceBookmarks: 'id, user_id, resource_id, [user_id+resource_id]',
      
      // AI Assistant
      aiConversations: 'id, user_id, last_message_at, [user_id+last_message_at]',
      aiMessages: 'id, conversation_id, role, created_at, [conversation_id+created_at]',
      
      // Forums
      forumThreads: 'id, category_id, author_id, status, created_at, is_pinned, [category_id+created_at], *tags',
      forumPosts: 'id, thread_id, author_id, created_at, [thread_id+created_at]',
      
      // System
      notifications: 'id, user_id, type, created_at, is_read, [user_id+created_at], [user_id+is_read]',
      syncQueue: 'id, entity_type, entity_id, created_at, retry_count, [entity_type+entity_id]',
      syncMetadata: 'entity_id, entity_type, [entity_type+entity_id]',
      users: 'id, email'
    });
  }

  /**
   * Clear all data (useful for logout)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.chats.clear(),
      this.messages.clear(),
      this.notes.clear(),
      this.reminders.clear(),
      this.courses.clear(),
      this.courseProgress.clear(),
      this.lessonProgress.clear(),
      this.resources.clear(),
      this.resourceBookmarks.clear(),
      this.aiConversations.clear(),
      this.aiMessages.clear(),
      this.forumThreads.clear(),
      this.forumPosts.clear(),
      this.notifications.clear(),
      this.syncQueue.clear(),
      this.syncMetadata.clear()
    ]);
  }

  /**
   * Clear user-specific data only
   */
  async clearUserData(userId: string): Promise<void> {
    await Promise.all([
      this.notes.where('user_id').equals(userId).delete(),
      this.reminders.where('user_id').equals(userId).delete(),
      this.courseProgress.where('user_id').equals(userId).delete(),
      this.resourceBookmarks.where('user_id').equals(userId).delete(),
      this.aiConversations.where('user_id').equals(userId).delete(),
      this.notifications.where('user_id').equals(userId).delete(),
      this.syncQueue.where('user_id').equals(userId).delete()
    ]);
  }

  /**
   * Get database size estimate
   */
  async getStorageInfo(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  }

  /**
   * Delete old messages to save space
   */
  async cleanOldMessages(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const deleted = await this.messages
      .where('created_at')
      .below(cutoffDate.toISOString())
      .delete();
    
    return deleted;
  }

  /**
   * Delete old notifications
   */
  async cleanOldNotifications(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const deleted = await this.notifications
      .where('created_at')
      .below(cutoffDate.toISOString())
      .and(n => n.is_read)
      .delete();
    
    return deleted;
  }
}

// Singleton instance
export const db = new StudentLibDB();

/**
 * Database Helper Functions
 */

// ============================================
// CHAT HELPERS
// ============================================

export const chatHelpers = {
  /**
   * Get all chats ordered by activity
   */
  async getAll(options: { includeArchived?: boolean } = {}): Promise<Chat[]> {
    let query = db.chats.orderBy('last_activity_at').reverse();
    
    if (!options.includeArchived) {
      query = query.filter(chat => !chat.is_archived);
    }
    
    return await query.toArray();
  },

  /**
   * Get pinned chats
   */
  async getPinned(): Promise<Chat[]> {
    return await db.chats
      .where('is_pinned')
      .equals(1)
      .sortBy('last_activity_at');
  },

  /**
   * Get unread chat count
   */
  async getUnreadCount(): Promise<number> {
    const chats = await db.chats.toArray();
    return chats.reduce((sum, chat) => sum + chat.unread_count, 0);
  },

  /**
   * Mark chat as read
   */
  async markAsRead(chatId: string): Promise<void> {
    await db.chats.update(chatId, { unread_count: 0 });
  },

  /**
   * Toggle pin status
   */
  async togglePin(chatId: string): Promise<void> {
    const chat = await db.chats.get(chatId);
    if (chat) {
      await db.chats.update(chatId, { is_pinned: !chat.is_pinned });
    }
  },

  /**
   * Toggle archive status
   */
  async toggleArchive(chatId: string): Promise<void> {
    const chat = await db.chats.get(chatId);
    if (chat) {
      await db.chats.update(chatId, { is_archived: !chat.is_archived });
    }
  }
};

// ============================================
// MESSAGE HELPERS
// ============================================

export const messageHelpers = {
  /**
   * Get messages for a chat
   */
  async getForChat(chatId: string, limit: number = 50): Promise<Message[]> {
    return await db.messages
      .where('[chat_id+created_at]')
      .between([chatId, Dexie.minKey], [chatId, Dexie.maxKey])
      .reverse()
      .limit(limit)
      .toArray();
  },

  /**
   * Get messages with pagination
   */
  async getForChatPaginated(
    chatId: string,
    lastMessageId?: string,
    limit: number = 50
  ): Promise<Message[]> {
    let query = db.messages
      .where('chat_id')
      .equals(chatId)
      .reverse();

    if (lastMessageId) {
      const lastMsg = await db.messages.get(lastMessageId);
      if (lastMsg) {
        query = query.filter(m => m.created_at < lastMsg.created_at);
      }
    }

    return await query.limit(limit).toArray();
  },

  /**
   * Add optimistic message
   */
  async addOptimistic(message: Message): Promise<void> {
    await db.messages.add(message);
  },

  /**
   * Update message status
   */
  async updateStatus(messageId: string, status: Message['status']): Promise<void> {
    await db.messages.update(messageId, { status });
  },

  /**
   * Search messages
   */
  async search(query: string, chatId?: string): Promise<Message[]> {
    let messages = await db.messages.toArray();
    
    if (chatId) {
      messages = messages.filter(m => m.chat_id === chatId);
    }
    
    const lowerQuery = query.toLowerCase();
    return messages.filter(m => 
      m.content.toLowerCase().includes(lowerQuery)
    ).slice(0, 50);
  }
};

// ============================================
// NOTE HELPERS
// ============================================

export const noteHelpers = {
  /**
   * Get all notes for user
   */
  async getAll(userId: string, options: {
    sortBy?: 'updated_at' | 'created_at' | 'title';
    favorites?: boolean;
    tags?: string[];
  } = {}): Promise<Note[]> {
    let notes = await db.notes
      .where('user_id')
      .equals(userId)
      .toArray();

    if (options.favorites) {
      notes = notes.filter(n => n.is_favorite);
    }

    if (options.tags && options.tags.length > 0) {
      notes = notes.filter(n => 
        options.tags!.some(tag => n.tags.includes(tag))
      );
    }

    // Sort
    const sortBy = options.sortBy || 'updated_at';
    notes.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
    });

    return notes;
  },

  /**
   * Search notes
   */
  async search(userId: string, query: string): Promise<Note[]> {
    const notes = await db.notes.where('user_id').equals(userId).toArray();
    const lowerQuery = query.toLowerCase();
    
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  /**
   * Get all tags
   */
  async getAllTags(userId: string): Promise<string[]> {
    const notes = await db.notes.where('user_id').equals(userId).toArray();
    const tagSet = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  },

  /**
   * Toggle favorite
   */
  async toggleFavorite(noteId: string): Promise<void> {
    const note = await db.notes.get(noteId);
    if (note) {
      await db.notes.update(noteId, { is_favorite: !note.is_favorite });
    }
  }
};

// ============================================
// REMINDER HELPERS
// ============================================

export const reminderHelpers = {
  /**
   * Get upcoming reminders
   */
  async getUpcoming(userId: string, limit: number = 10): Promise<Reminder[]> {
    const now = new Date().toISOString();
    
    return await db.reminders
      .where('[user_id+remind_at]')
      .between([userId, now], [userId, Dexie.maxKey])
      .and(r => r.status === 'pending')
      .limit(limit)
      .toArray();
  },

  /**
   * Get overdue reminders
   */
  async getOverdue(userId: string): Promise<Reminder[]> {
    const now = new Date().toISOString();
    
    return await db.reminders
      .where('[user_id+remind_at]')
      .between([userId, Dexie.minKey], [userId, now])
      .and(r => r.status === 'pending')
      .toArray();
  },

  /**
   * Get reminders by status
   */
  async getByStatus(userId: string, status: Reminder['status']): Promise<Reminder[]> {
    return await db.reminders
      .where('[user_id+status]')
      .equals([userId, status])
      .toArray();
  },

  /**
   * Mark as completed
   */
  async markCompleted(reminderId: string): Promise<void> {
    await db.reminders.update(reminderId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  },

  /**
   * Snooze reminder
   */
  async snooze(reminderId: string, minutes: number): Promise<void> {
    const snoozedUntil = new Date();
    snoozedUntil.setMinutes(snoozedUntil.getMinutes() + minutes);
    
    await db.reminders.update(reminderId, {
      status: 'snoozed',
      snoozed_until: snoozedUntil.toISOString()
    });
  }
};

// ============================================
// SYNC QUEUE HELPERS
// ============================================

export const syncQueueHelpers = {
  /**
   * Add to sync queue
   */
  async add(item: Omit<SyncQueue, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const queueItem: SyncQueue = {
      ...item,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    };
    
    await db.syncQueue.add(queueItem);
  },

  /**
   * Get pending items
   */
  async getPending(limit: number = 50): Promise<SyncQueue[]> {
    return await db.syncQueue
      .orderBy('created_at')
      .limit(limit)
      .toArray();
  },

  /**
   * Mark as synced (remove from queue)
   */
  async remove(id: string): Promise<void> {
    await db.syncQueue.delete(id);
  },

  /**
   * Increment retry count
   */
  async incrementRetry(id: string, error: string): Promise<void> {
    const item = await db.syncQueue.get(id);
    if (item) {
      await db.syncQueue.update(id, {
        retry_count: item.retry_count + 1,
        last_retry_at: new Date().toISOString(),
        error_message: error
      });
    }
  },

  /**
   * Clear all synced items
   */
  async clearSynced(): Promise<void> {
    // Remove items that have been successfully synced (not in queue anymore)
    // This is handled by the sync service
  },

  /**
   * Get failed items
   */
  async getFailed(): Promise<SyncQueue[]> {
    return await db.syncQueue
      .filter(item => item.retry_count >= 3)
      .toArray();
  }
};

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkHelpers = {
  /**
   * Bulk insert chats
   */
  async upsertChats(chats: Chat[]): Promise<void> {
    await db.chats.bulkPut(chats);
  },

  /**
   * Bulk insert messages
   */
  async upsertMessages(messages: Message[]): Promise<void> {
    await db.messages.bulkPut(messages);
  },

  /**
   * Bulk insert notes
   */
  async upsertNotes(notes: Note[]): Promise<void> {
    await db.notes.bulkPut(notes);
  },

  /**
   * Bulk delete by IDs
   */
  async deleteByIds<T>(table: Table<T, string>, ids: string[]): Promise<void> {
    await table.bulkDelete(ids);
  }
};

// Export singleton and helpers
export default db;
