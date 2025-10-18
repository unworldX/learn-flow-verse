// Optimized Conversations Hook V2
// Implements: Cache-first, delta sync, batch queries, rate limiting
// Target: Reduce API calls from 5000+/hour to <1000/hour

import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { cacheManager, CacheKeys, CacheTTL } from '@/lib/cacheManager';
import { apiRateLimiter } from '@/lib/apiRateLimiter';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Chat {
  chat_id: string;
  chat_type: 'group' | 'direct';
  chat_name: string;
  chat_avatar: string;
  last_message_id?: string;
  last_message_content?: string;
  last_message_type?: string;
  last_message_time?: string;
  unread_count: number;
  is_pinned: boolean;
  member_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  encrypted_content: string;
  message_type?: string;
  created_at: string;
  updated_at?: string;
  reply_to_message_id?: string;
  group_id: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  status?: string;
}

export function useOptimizedConversationsV2() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<RealtimeChannel | null>(null);
  
  const lastSyncTimeRef = useRef<Record<string, Date>>({});
  const profileCacheRef = useRef<Set<string>>(new Set());

  /**
   * Fetch chats using RPC (single optimized query)
   */
  const fetchChats = useCallback(async (force = false) => {
    if (!user?.id) return;

    const cacheKey = CacheKeys.chatList();

    // Return cached if valid
    if (!force) {
      const cached = cacheManager.get<Chat[]>(cacheKey, CacheTTL.CHAT_LIST);
      if (cached) {
        setChats(cached);
        setIsLoading(false);
        
        // Background refresh if stale
        if (cacheManager.isStale(cacheKey, CacheTTL.CHAT_LIST / 2)) {
          fetchChatsFromDB();
        }
        return;
      }

      // Try IndexedDB
      try {
        const stored = await indexedDBStorage.getChats();
        if (stored && stored.length > 0) {
          setChats(stored);
          setIsLoading(false);
          // Fetch fresh data in background
          fetchChatsFromDB();
          return;
        }
      } catch (error) {
        console.error('IndexedDB read error:', error);
      }
    }

    await fetchChatsFromDB();
  }, [user?.id]);

  const fetchChatsFromDB = async () => {
    if (!user?.id) return;

    try {
      const data = await apiRateLimiter.execute(
        'fetch_chats',
        async () => {
          const { data, error } = await supabase.rpc('get_user_chats', {
            user_uuid: user.id,
          });
          
          if (error) throw error;
          return data || [];
        },
        2 // High priority
      );

      setChats(data);
      
      // Cache in memory and IndexedDB
      const cacheKey = CacheKeys.chatList();
      cacheManager.set(cacheKey, data, { ttl: CacheTTL.CHAT_LIST, persist: true });
      
      try {
        await indexedDBStorage.saveChats(data);
      } catch (error) {
        console.error('IndexedDB write error:', error);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: 'Error loading chats',
        description: 'Please refresh the page',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  /**
   * Fetch messages with delta sync
   */
  const fetchMessages = useCallback(async (chatId: string, force = false) => {
    if (!user?.id) return;

    const cacheKey = CacheKeys.chatMessages(chatId);

    // Return cached if valid
    if (!force) {
      const cached = cacheManager.get<Message[]>(cacheKey, CacheTTL.MESSAGES);
      if (cached) {
        setMessages(prev => ({ ...prev, [chatId]: cached }));
        
        // Background refresh if stale
        if (cacheManager.isStale(cacheKey, CacheTTL.MESSAGES / 2)) {
          fetchMessagesFromDB(chatId);
        }
        return;
      }

      // Try IndexedDB
      try {
        const stored = await indexedDBStorage.getMessages(chatId);
        if (stored && stored.length > 0) {
          setMessages(prev => ({ ...prev, [chatId]: stored }));
          // Fetch delta in background
          fetchMessagesFromDB(chatId);
          return;
        }
      } catch (error) {
        console.error('IndexedDB read error:', error);
      }
    }

    await fetchMessagesFromDB(chatId);
  }, [user?.id]);

  const fetchMessagesFromDB = async (chatId: string) => {
    if (!user?.id) return;

    try {
      // Get last sync time
      const lastSync = lastSyncTimeRef.current[chatId];
      
      let data: Message[];

      if (lastSync) {
        // Delta sync: only fetch new/updated messages
        const deltaData = await apiRateLimiter.execute(
          `fetch_messages_delta_${chatId}`,
          async () => {
            const { data, error } = await supabase.rpc('get_messages_since', {
              p_group_id: chatId,
              p_since_timestamp: lastSync.toISOString(),
            });
            
            if (error) throw error;
            return data || [];
          },
          2
        );

        // Merge with cached messages
        const cached = messages[chatId] || [];
        data = mergeDeltaMessages(cached, deltaData);
      } else {
        // Full fetch (first time)
        data = await apiRateLimiter.execute(
          `fetch_messages_${chatId}`,
          async () => {
            const { data, error } = await supabase
              .from('group_messages')
              .select('id, sender_id, body, created_at, updated_at, reply_to_id, group_id')
              .eq('group_id', chatId)
              .order('created_at', { ascending: true })
              .limit(100);

            if (error) throw error;
            return (data || []) as Message[];
          },
          2
        );
      }

      // Update state and cache
      setMessages(prev => ({ ...prev, [chatId]: data }));
      lastSyncTimeRef.current[chatId] = new Date();

      cacheManager.set(cacheKey, data, { ttl: CacheTTL.MESSAGES, persist: true });
      
      try {
        await indexedDBStorage.saveMessages(chatId, data);
      } catch (error) {
        console.error('IndexedDB write error:', error);
      }

      // Batch fetch user profiles
      const senderIds = [...new Set(data.map(m => m.sender_id))];
      await fetchUserProfiles(senderIds);

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  /**
   * Batch fetch user profiles
   */
  const fetchUserProfiles = useCallback(async (userIds: string[]) => {
    // Filter out already cached profiles
    const uncachedIds = userIds.filter(id => !profileCacheRef.current.has(id));
    
    if (uncachedIds.length === 0) return;

    try {
      const data = await apiRateLimiter.execute(
        'fetch_profiles_batch',
        async () => {
          const { data, error } = await supabase.rpc('get_user_profiles_batch', {
            user_ids: uncachedIds,
          });
          
          if (error) throw error;
          return data || [];
        },
        1 // Lower priority
      );

      const profileMap: Record<string, UserProfile> = {};
      data.forEach((profile: UserProfile) => {
        profileMap[profile.id] = profile;
        profileCacheRef.current.add(profile.id);
      });

      setProfiles(prev => ({ ...prev, ...profileMap }));

      // Cache each profile
      data.forEach((profile: UserProfile) => {
        cacheManager.set(
          CacheKeys.userProfile(profile.id),
          profile,
          { ttl: CacheTTL.USER_PROFILE, persist: true }
        );
      });

      try {
        await indexedDBStorage.saveUserProfiles(data);
      } catch (error) {
        console.error('IndexedDB write error:', error);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }, []);

  /**
   * Send message with optimistic update
   */
  const sendMessage = useCallback(async (
    chatId: string,
    content: string,
    replyToMessageId?: string
  ) => {
    if (!user?.id) return;

    // Optimistic update
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      sender_id: user.id,
      encrypted_content: content,
      message_type: 'text',
      created_at: new Date().toISOString(),
      reply_to_message_id: replyToMessageId,
      group_id: chatId,
    };

    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), tempMessage],
    }));

    try {
      await apiRateLimiter.execute(
        `send_message_${chatId}`,
        async () => {
          const { data, error } = await supabase
            .from('group_messages')
            .insert({
              group_id: chatId,
              sender_id: user.id,
              encrypted_content: content,
              message_type: 'text',
              reply_to_message_id: replyToMessageId,
            })
            .select()
            .single();

          if (error) throw error;

          // Replace temp message with real one
          setMessages(prev => ({
            ...prev,
            [chatId]: prev[chatId]?.map(m => 
              m.id === tempMessage.id ? { ...data, group_id: chatId } as Message : m
            ) || [],
          }));

          // Invalidate caches
          cacheManager.invalidate(CacheKeys.chatMessages(chatId));
          cacheManager.invalidate(CacheKeys.chatList());

          return data;
        },
        2 // High priority
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId]?.filter(m => m.id !== tempMessage.id) || [],
      }));

      toast({
        title: 'Failed to send message',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  /**
   * Subscribe to realtime for active chat only
   */
  const subscribeToChat = useCallback((chatId: string | null) => {
    // Unsubscribe from previous channel
    if (activeChannel) {
      activeChannel.unsubscribe();
      setActiveChannel(null);
    }

    if (!chatId) return;

    console.log(`🔌 Subscribing to chat: ${chatId}`);

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('📨 New message received:', payload.new);
          
          const newMessage = payload.new as Message;
          
          setMessages(prev => {
            const existing = prev[chatId] || [];
            // Avoid duplicates
            if (existing.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return {
              ...prev,
              [chatId]: [...existing, newMessage],
            };
          });

          // Invalidate cache
          cacheManager.invalidate(CacheKeys.chatMessages(chatId));
        }
      )
      .subscribe((status) => {
        console.log(`Realtime status: ${status}`);
      });

    setActiveChannel(channel);
  }, [activeChannel]);

  /**
   * Initialize: Load from IndexedDB, then fetch fresh data
   */
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        // Load cached chats immediately
        const cachedChats = await indexedDBStorage.getChats();
        if (cachedChats && cachedChats.length > 0) {
          setChats(cachedChats);
          setIsLoading(false);
        }

        // Load cached profiles
        const cachedProfiles = await indexedDBStorage.getAllUserProfiles();
        if (cachedProfiles && cachedProfiles.length > 0) {
          const profileMap: Record<string, UserProfile> = {};
          cachedProfiles.forEach(p => {
            profileMap[p.id] = p;
            profileCacheRef.current.add(p.id);
          });
          setProfiles(profileMap);
        }

        // Fetch fresh data
        await fetchChats();
      } catch (error) {
        console.error('Initialization error:', error);
        setIsLoading(false);
      }
    })();
  }, [user?.id, fetchChats]);

  /**
   * Background sync every 2 minutes
   */
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        console.log('🔄 Background sync triggered');
        fetchChatsFromDB();
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);

  /**
   * Cleanup realtime on unmount
   */
  useEffect(() => {
    return () => {
      if (activeChannel) {
        console.log('🔌 Cleaning up realtime subscription');
        activeChannel.unsubscribe();
      }
    };
  }, [activeChannel]);

  return {
    chats,
    messages,
    profiles,
    isLoading,
    fetchMessages,
    sendMessage,
    subscribeToChat,
    refreshChats: () => fetchChats(true),
    unsubscribeFromChat: () => {
      if (activeChannel) {
        activeChannel.unsubscribe();
        setActiveChannel(null);
      }
    },
  };
}

/**
 * Merge delta messages with cached messages
 */
function mergeDeltaMessages(cached: Message[], delta: Message[]): Message[] {
  const messageMap = new Map(cached.map(m => [m.id, m]));
  
  delta.forEach(m => {
    messageMap.set(m.id, m);
  });
  
  return Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}
