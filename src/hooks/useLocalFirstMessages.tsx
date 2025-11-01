/**
 * Local-First Message Hook
 * Implements optimistic UI updates with background sync
 */

import { useCallback, useEffect, useState } from "react";
import { db, messageHelpers, syncQueueHelpers } from "@/lib/dexieDB";
import { syncService } from "@/lib/syncService";
import { supabase } from "@/integrations/supabase/client";
import { Message as DexieMessage } from "@/types/entities";
import { Message, Attachment } from "@/types/chat";
import { useAuth } from "@/contexts/useAuth";

const CURRENT_USER_ID = "me";

export function useLocalFirstMessages(chatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Convert Dexie message to Chat message format
  const convertMessage = useCallback((msg: DexieMessage): Message => {
    return {
      id: msg.id,
      chatId: msg.chat_id,
      senderId: msg.sender_id === user?.id ? CURRENT_USER_ID : msg.sender_id,
      kind: "text",
      body: msg.content,
      attachments: msg.attachments as Attachment[] | undefined,
      status: msg.status as Message["status"],
      timeline: {
        sentAt: msg.created_at,
        deliveredAt: msg.created_at,
        readAt: msg.status === "read" ? msg.created_at : undefined,
      },
      reactions: msg.reactions ? JSON.parse(JSON.stringify(msg.reactions)) : undefined,
      replyTo: msg.reply_to_id ? {
        messageId: msg.reply_to_id,
        senderId: msg.sender_id,
        body: msg.content,
      } : undefined,
    };
  }, [user?.id]);

  // Load messages from local DB
  const loadMessages = useCallback(async () => {
    if (!chatId || !user?.id) return;

    setIsLoading(true);
    try {
      const localMessages = await messageHelpers.getForChat(chatId);
      setMessages(localMessages.map(convertMessage));
    } catch (error) {
      console.error("[useLocalFirstMessages] Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, user?.id, convertMessage]);

  // Send message with optimistic update
  const sendMessage = useCallback(async (
    content: string,
    attachments?: Attachment[],
    replyToId?: string
  ) => {
    if (!chatId || !user?.id) return;

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create optimistic message
    const optimisticMessage: DexieMessage = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content,
      attachments: attachments as any,
      status: "sent",
      reply_to_id: replyToId || null,
      reactions: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      message_type: "text",
      is_edited: false,
      is_pinned: false,
      is_starred: false,
      forwarded_from_id: null,
      read_by: [],
      delivered_to: [],
    };

    // 1. Update UI immediately (optimistic)
    const newMessage = convertMessage(optimisticMessage);
    setMessages((prev) => [...prev, newMessage]);

    // 2. Save to local DB
    await messageHelpers.addOptimistic(optimisticMessage);

    // 3. Queue for sync to backend
    await syncQueueHelpers.add({
      user_id: user.id,
      entity_type: "message",
      entity_id: tempId,
      operation: "CREATE",
      payload: {
        id: tempId,
        chat_id: chatId,
        sender_id: user.id,
        encrypted_content: content,
        message_type: attachments?.[0]?.type === "image" ? "image" : "text",
        file_url: attachments?.[0]?.url,
        created_at: now,
      },
      retry_count: 0,
    });

    // 4. Trigger sync if online
    if (navigator.onLine && user.id) {
      syncService.forceSyncNow(user.id);
    }
  }, [chatId, user?.id, convertMessage]);

  // Listen for real-time updates
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: chatId.startsWith("dm-") ? "direct_messages" : "group_messages",
          filter: chatId.startsWith("dm-") ? undefined : `group_id=eq.${chatId}`,
        },
        async (payload) => {
          // Update local DB
          const newMsg = payload.new as any;
          const dexieMsg: DexieMessage = {
            id: newMsg.id,
            chat_id: chatId,
            sender_id: newMsg.sender_id,
            content: newMsg.encrypted_content || "",
            attachments: newMsg.file_url ? [{
              id: crypto.randomUUID(),
              type: "image",
              url: newMsg.file_url,
            }] as any : null,
            status: "delivered",
            reply_to_id: newMsg.reply_to_message_id || null,
            reactions: null,
            created_at: newMsg.created_at,
            updated_at: newMsg.created_at,
            deleted_at: null,
            message_type: "text",
            is_edited: false,
            is_pinned: false,
            is_starred: false,
            forwarded_from_id: null,
            read_by: [],
            delivered_to: [],
          };

          await db.messages.put(dexieMsg);

          // Update UI
          setMessages((prev) => [...prev, convertMessage(dexieMsg)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, convertMessage]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    isLoading,
    sendMessage,
    refreshMessages: loadMessages,
  };
}
