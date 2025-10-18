/**
 * 🚀 ULTRA-OPTIMIZED Conversations Hook - Local-First with Dexie
 * 
 * Performance Targets:
 * - Initial load: < 50ms (from Dexie cache)
 * - Send message: < 10ms (optimistic update)
 * - UI updates: Instant (< 10ms)
 * - Background sync: Non-blocking
 * 
 * Architecture:
 * User Action → Dexie (< 10ms) → UI Update → Background Sync → Supabase
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db, chatHelpers, messageHelpers, syncQueueHelpers } from '@/lib/dexieDB';
import { syncService } from '@/lib/syncService';
import { supabase } from '@/lib/supabaseClient';
import type { Chat, Message, GroupMetadata, UserProfile, ChatSummary } from '@/types/entities';

export function useConversationsOptimized() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [groupMetadata, setGroupMetadata] = useState<Record<string, GroupMetadata>>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const loadedMessagesRef = useRef<Set<string>>(new Set());
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * ⚡ INSTANT: Load chats from Dexie (< 50ms)
   */
  const loadChats = useCallback(async () => {
    console.time('⚡ Load Chats from Dexie');
    
    try {
      // Load from Dexie instantly
      const cachedChats = await chatHelpers.getAll();
      
      // Convert to ChatSummary format
      const summaries: ChatSummary[] = cachedChats.map(chat => ({
        id: chat.id,
        type: chat.is_direct ? 'direct' as const : 'group' as const,
        title: chat.name || 'Untitled Chat',
        avatarUrl: chat.avatar_url,
        lastMessage: chat.last_message_content || '',
        lastMessageType: 'text',
        lastActivityAt: chat.last_message_time || chat.updated_at,
        unreadCount: chat.unread_count || 0,
        pinned: chat.is_pinned || false,
        archived: chat.is_archived || false,
        muted: false,
        participants: [], // Will be loaded separately if needed
      }));
      
      setChats(summaries);
      setIsLoading(false);
      
      console.timeEnd('⚡ Load Chats from Dexie');
      
      // Trigger background sync (non-blocking)
      if (user?.id && navigator.onLine) {
        debouncedSync();
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * ⚡ INSTANT: Load messages for a chat (< 50ms)
   */
  const loadMessages = useCallback(async (chatId: string) => {
    if (loadedMessagesRef.current.has(chatId)) {
      // Already loaded, skip
      return;
    }
    
    console.time(`⚡ Load Messages for ${chatId}`);
    
    try {
      // Load from Dexie instantly
      const cachedMessages = await messageHelpers.getForChat(chatId, 100);
      
      setMessages(prev => ({
        ...prev,
        [chatId]: cachedMessages
      }));
      
      loadedMessagesRef.current.add(chatId);
      console.timeEnd(`⚡ Load Messages for ${chatId}`);
      
      // Mark as read
      await chatHelpers.markAsRead(chatId);
      
      // Trigger background sync for this chat
      if (user?.id && navigator.onLine) {
        debouncedSync();
      }
    } catch (error) {
      console.error(`Error loading messages for ${chatId}:`, error);
    }
  }, [user?.id]);

  /**
   * ⚡ INSTANT: Send message with optimistic update (< 10ms)
   * Order: UI FIRST → Dexie → Queue → Background Sync
   */
  const sendMessage = useCallback(async (
    chatId: string,
    content: string,
    attachments?: any[],
    replyToId?: string
  ) => {
    if (!user?.id) return;
    
    console.time('⚡ Send Message (Optimistic)');
    
    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content,
      message_type: attachments?.length ? 'media' : 'text',
      status: 'sending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reply_to_message_id: replyToId,
      reactions: [],
      read_by: [user.id],
      sync_status: 'pending',
      attachments: attachments || [],
    };

    // 1️⃣ UPDATE UI FIRST - INSTANT (< 5ms) ⚡
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), optimisticMessage]
    }));
    
    console.timeEnd('⚡ Send Message (Optimistic)');
    
    try {
      // 2️⃣ UPDATE LOCAL DB (Dexie) - (< 10ms) 💾
      await messageHelpers.addOptimistic(optimisticMessage);
      
      // 3️⃣ QUEUE FOR SYNC - Background 📤
      await syncQueueHelpers.add({
        user_id: user.id,
        entity_type: 'message',
        entity_id: tempId,
        operation: 'CREATE',
        data: optimisticMessage,
        retry_count: 0,
        created_at: new Date().toISOString(),
      });
      
      // 4️⃣ TRIGGER BACKGROUND SYNC (non-blocking) 🔄
      debouncedSync();
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Rollback UI on error
      setMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId]?.filter(m => m.id !== tempId) || []
      }));
      
      toast({
        title: 'Failed to send message',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  /**
   * 🔄 Background sync (debounced, non-blocking)
   */
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(async () => {
      if (!user?.id || !navigator.onLine) return;
      
      setIsSyncing(true);
      try {
        await syncService.syncAll(user.id);
        
        // Reload chats after sync
        const updatedChats = await chatHelpers.getAll();
        const summaries: ChatSummary[] = updatedChats.map(chat => ({
          id: chat.id,
          type: chat.is_direct ? 'direct' as const : 'group' as const,
          title: chat.name || 'Untitled Chat',
          avatarUrl: chat.avatar_url,
          lastMessage: chat.last_message_content || '',
          lastMessageType: 'text',
          lastActivityAt: chat.last_message_time || chat.updated_at,
          unreadCount: chat.unread_count || 0,
          pinned: chat.is_pinned || false,
          archived: chat.is_archived || false,
          muted: false,
          participants: [],
        }));
        setChats(summaries);
        
        // Reload messages for active chat
        if (selectedChatId) {
          const updatedMessages = await messageHelpers.getForChat(selectedChatId, 100);
          setMessages(prev => ({
            ...prev,
            [selectedChatId]: updatedMessages
          }));
        }
      } catch (error) {
        console.error('Background sync error:', error);
      } finally {
        setIsSyncing(false);
      }
    }, 1000); // 1 second debounce
  }, [user?.id, selectedChatId]);

  /**
   * Initialize sync service and load data
   */
  useEffect(() => {
    if (!user?.id) return;
    
    // Initialize sync service
    syncService.initialize(user.id);
    
    // Load chats immediately
    loadChats();
    
    // Setup realtime subscriptions
    const channel = supabase
      .channel(`user-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_messages',
      }, async (payload) => {
        console.log('📨 Realtime message received:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as Message;
          
          // Add to Dexie
          await db.messages.add(newMessage);
          
          // Update UI if chat is active
          if (newMessage.chat_id === selectedChatId) {
            setMessages(prev => ({
              ...prev,
              [newMessage.chat_id]: [...(prev[newMessage.chat_id] || []), newMessage]
            }));
          }
          
          // Update chat last message
          await chatHelpers.updateLastMessage(newMessage.chat_id, newMessage);
          loadChats();
        }
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user?.id, loadChats, selectedChatId]);

  /**
   * Load messages when chat is selected
   */
  useEffect(() => {
    if (selectedChatId) {
      loadMessages(selectedChatId);
    }
  }, [selectedChatId, loadMessages]);

  /**
   * Auto-sync every 2 minutes
   */
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      if (!document.hidden && navigator.onLine) {
        console.log('🔄 Auto-sync triggered');
        debouncedSync();
      }
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [user?.id, debouncedSync]);

  /**
   * Sync on reconnect
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Back online - triggering sync');
      if (user?.id) {
        debouncedSync();
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user?.id, debouncedSync]);

  // Helper functions
  const togglePinChat = useCallback(async (chatId: string) => {
    await chatHelpers.togglePin(chatId);
    loadChats();
  }, [loadChats]);

  const toggleArchive = useCallback(async (chatId: string) => {
    await chatHelpers.toggleArchive(chatId);
    loadChats();
  }, [loadChats]);

  const markAsRead = useCallback(async (chatId: string) => {
    await chatHelpers.markAsRead(chatId);
    loadChats();
  }, [loadChats]);

  const getUnreadCount = useCallback(async () => {
    return await chatHelpers.getUnreadCount();
  }, []);

  return {
    // State
    chats,
    messages: selectedChatId ? messages[selectedChatId] || [] : [],
    allMessages: messages,
    profiles,
    groupMetadata,
    selectedChatId,
    isLoading,
    isSyncing,
    
    // Actions
    setSelectedChatId,
    sendMessage,
    loadMessages,
    togglePinChat,
    toggleArchive,
    markAsRead,
    getUnreadCount,
    refreshChats: loadChats,
    forceSyncNow: () => user?.id && syncService.forceSyncNow(user.id),
  };
}
