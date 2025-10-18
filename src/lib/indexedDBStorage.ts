/**
 * IndexedDB Storage Layer
 * Persistent local storage for chat data, messages, and metadata
 */

import { ChatSummary, Message, UserProfile } from '@/types/chat';

const DB_NAME = 'StudentLibChatDB';
const DB_VERSION = 1;

interface DBSchema {
  chats: ChatSummary;
  messages: Message;
  userProfiles: UserProfile;
  metadata: { key: string; value: any; timestamp: number };
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Chats store
        if (!db.objectStoreNames.contains('chats')) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
          chatStore.createIndex('type', 'type', { unique: false });
          chatStore.createIndex('lastActivityAt', 'lastActivityAt', { unique: false });
          chatStore.createIndex('pinned', 'pinned', { unique: false });
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('chatId', 'chatId', { unique: false });
          messageStore.createIndex('senderId', 'senderId', { unique: false });
          messageStore.createIndex('created_at', 'timeline.sentAt', { unique: false });
        }

        // User profiles store
        if (!db.objectStoreNames.contains('userProfiles')) {
          const profileStore = db.createObjectStore('userProfiles', { keyPath: 'id' });
          profileStore.createIndex('name', 'name', { unique: false });
        }

        // Metadata store (for sync timestamps, settings, etc.)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }

        console.log('✅ IndexedDB schema created');
      };
    });

    return this.initPromise;
  }

  /**
   * Save chats to IndexedDB
   */
  async saveChats(chats: ChatSummary[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction(['chats'], 'readwrite');
    const store = transaction.objectStore('chats');

    for (const chat of chats) {
      store.put(chat);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get all chats from IndexedDB
   */
  async getChats(): Promise<ChatSummary[]> {
    await this.init();
    if (!this.db) return [];

    const transaction = this.db.transaction(['chats'], 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save messages for a chat
   */
  async saveMessages(chatId: string, messages: Message[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');

    // Add chatId to each message if not present
    for (const message of messages) {
      const msgWithChatId = { ...message, chatId };
      store.put(msgWithChatId);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get messages for a chat
   */
  async getMessages(chatId: string, limit: number = 100): Promise<Message[]> {
    await this.init();
    if (!this.db) return [];

    const transaction = this.db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const index = store.index('chatId');
    const request = index.getAll(chatId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const messages = request.result || [];
        // Sort by timestamp descending and limit
        const sorted = messages
          .sort((a, b) => 
            new Date(b.timeline.sentAt).getTime() - new Date(a.timeline.sentAt).getTime()
          )
          .slice(0, limit);
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save user profiles
   */
  async saveUserProfiles(profiles: UserProfile[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction(['userProfiles'], 'readwrite');
    const store = transaction.objectStore('userProfiles');

    for (const profile of profiles) {
      store.put(profile);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    await this.init();
    if (!this.db) return null;

    const transaction = this.db.transaction(['userProfiles'], 'readonly');
    const store = transaction.objectStore('userProfiles');
    const request = store.get(userId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all user profiles
   */
  async getAllUserProfiles(): Promise<UserProfile[]> {
    await this.init();
    if (!this.db) return [];

    const transaction = this.db.transaction(['userProfiles'], 'readonly');
    const store = transaction.objectStore('userProfiles');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save metadata (sync timestamps, settings, etc.)
   */
  async saveMetadata(key: string, value: any): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');
    
    store.put({ key, value, timestamp: Date.now() });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get metadata
   */
  async getMetadata(key: string): Promise<any | null> {
    await this.init();
    if (!this.db) return null;

    const transaction = this.db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(key: string = 'lastSync'): Promise<number> {
    const timestamp = await this.getMetadata(key);
    return timestamp || 0;
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSyncTime(key: string = 'lastSync'): Promise<void> {
    await this.saveMetadata(key, Date.now());
  }

  /**
   * Delete messages older than X days
   */
  async cleanOldMessages(daysToKeep: number = 30): Promise<void> {
    await this.init();
    if (!this.db) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTime = cutoffDate.getTime();

    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    const index = store.index('created_at');
    
    const request = index.openCursor();
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const message = cursor.value;
          const messageTime = new Date(message.timeline.sentAt).getTime();
          
          if (messageTime < cutoffTime) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`🗑️ Cleaned ${deletedCount} old messages`);
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const storeNames = ['chats', 'messages', 'userProfiles', 'metadata'];
    const transaction = this.db.transaction(storeNames, 'readwrite');

    for (const storeName of storeNames) {
      transaction.objectStore(storeName).clear();
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('🗑️ IndexedDB cleared');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get database size estimate
   */
  async getStorageSize(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { usage: 0, quota: 0 };
  }
}

// Singleton instance
export const indexedDBStorage = new IndexedDBStorage();
