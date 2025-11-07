import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { handleRLSError } from "@/lib/auth";
import {
  Attachment,
  AttachmentType,
  ChatSummary,
  GroupMetadata,
  Message,
  MessageStatus,
  UserProfile,
} from "@/types/chat";

const CURRENT_USER_ID = "me";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

// Map attachment types to database-allowed message types
const mapAttachmentTypeToDBType = (type?: AttachmentType): string => {
  if (!type) return 'text';
  switch (type) {
    case 'image':
    case 'sticker':
    case 'gif':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
    case 'voice-note':
    case 'document':
      return 'file';
    default:
      return 'text';
  }
};

// Map DB type back to attachment type with hints from filename
const mapDBTypeToAttachmentType = (dbType: string, fileName?: string | null): AttachmentType => {
  if (dbType === 'image') return 'image';
  if (dbType === 'video') return 'video';
  if (dbType === 'file') {
    if (fileName) {
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.mp3') || lower.endsWith('.m4a') || lower.endsWith('.wav')) {
        return 'audio';
      }
      if (lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx')) {
        return 'document';
      }
    }
    return 'document';
  }
  return 'document';
};

export function useConversations() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [groupMetadata, setGroupMetadata] = useState<Record<string, GroupMetadata>>({});
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState<Record<string, { userId: string; lastTyped: number }[]>>({});

  const broadcastTyping = useCallback((chatId: string) => {
    if (!user?.id) return;
    const channel = supabase.channel(`typing-${chatId}`);
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          event: 'typing',
          payload: { userId: user.id },
        });
      }
    });
    setTimeout(() => channel.unsubscribe(), 1000);
  }, [user]);

  const fetchUserProfiles = useCallback(async (userIds: string[]) => {
    const idsToFetch = userIds.filter(id => !userProfiles[id] && id !== user?.id);
    if (idsToFetch.length === 0) return userProfiles;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", idsToFetch);

      if (error) throw error;

      const newProfiles = data.reduce((acc, profile) => {
        acc[profile.id] = {
          id: profile.id,
          name: profile.full_name || `User ${profile.id.slice(0, 6)}`,
          avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
        };
        return acc;
      }, {} as Record<string, UserProfile>);
      
      const updatedProfiles = { ...userProfiles, ...newProfiles };
      setUserProfiles(updatedProfiles);
      return updatedProfiles;
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      return userProfiles;
    }
  }, [user?.id, userProfiles]);

  // Fetch study groups and conversations
  const fetchChats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

  // Fetch study groups where user is a member
      const { data: groupMemberships, error: groupError } = await supabase
        .from("study_group_members")
        .select(`
          group_id,
          study_groups (
            id,
            name,
            description,
            created_by,
            created_at,
            is_private,
            invite_link,
            invite_code,
            invite_expires_at
          )
        `)
        .eq("user_id", user.id);

      if (groupError) throw groupError;

      // Fetch all members for these groups
      const groupIds = groupMemberships?.map(m => m.group_id) || [];
      
      const { data: allMembers, error: membersError } = await supabase
        .from("study_group_members")
        .select("*")
        .in("group_id", groupIds);

      if (membersError) throw membersError;

      // Preload user-level controls
      const { data: mutes } = await supabase
        .from("muted_chats")
        .select("chat_type, chat_id, muted_until")
        .eq("user_id", user.id);

      const { data: archives } = await supabase
        .from("archived_chats")
        .select("chat_type, chat_id")
        .eq("user_id", user.id);

      const { data: unreadOverrides } = await supabase
        .from("unread_overrides")
        .select("chat_type, chat_id, force_unread")
        .eq("user_id", user.id);

      const { data: pinnedChats } = await supabase
        .from("pinned_chats")
        .select("chat_type, chat_id")
        .eq("user_id", user.id);

      // Fetch latest message for each group
      const chatSummaries: ChatSummary[] = [];
      
      for (const membership of groupMemberships || []) {
        const group = membership.study_groups as unknown as { 
          id: string; 
          name: string; 
          description: string | null; 
          created_by: string; 
          created_at: string; 
          is_private: boolean;
          invite_link?: string | null;
          invite_code?: string | null;
          invite_expires_at?: string | null;
        } | null;
        if (!group) continue;

        const { data: latestMessage, error: latestMsgError } = await supabase
          .from("group_messages")
          .select("id, sender_id, encrypted_content, message_type, created_at, reply_to_message_id, file_url, file_name, file_size")
          .eq("group_id", group.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (latestMsgError && latestMsgError.code !== 'PGRST116') {
          console.error(`[useConversations] Error fetching latest message for group ${group.id}:`, {
            error: latestMsgError,
            message: latestMsgError.message,
            details: latestMsgError.details,
            hint: latestMsgError.hint,
            code: latestMsgError.code,
          });
        }

        // Get unread count
        const { data: groupMessages, error: groupMsgsError } = await supabase
          .from("group_messages")
          .select("id")
          .eq("group_id", group.id);

        if (groupMsgsError) {
          console.error(`[useConversations] Error fetching group messages for ${group.id}:`, {
            error: groupMsgsError,
            message: groupMsgsError.message,
            details: groupMsgsError.details,
            hint: groupMsgsError.hint,
            code: groupMsgsError.code,
          });
        }

        const { data: readMessages } = await supabase
          .from("message_reads")
          .select("message_id")
          .eq("user_id", user.id)
          .in("message_id", groupMessages?.map(m => m.id) || []);

  let unreadCount = (groupMessages?.length || 0) - (readMessages?.length || 0);
  const forceUnread = unreadOverrides?.some(u => u.chat_type === 'group' && u.chat_id === group.id && u.force_unread);
  if (forceUnread) unreadCount = Math.max(unreadCount, 1);

        const participants = allMembers?.filter(m => m.group_id === group.id).map(m => m.user_id) || [];

        chatSummaries.push({
          id: group.id,
          type: "group",
          title: group.name,
          subtitle: group.description || "Study Group",
          avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${group.name}`,
          participants: participants,
          lastMessageId: latestMessage?.id || null,
          unreadCount: unreadCount,
          pinned: pinnedChats?.some(p => p.chat_type === 'group' && p.chat_id === group.id) || false,
          archived: archives?.some(a => a.chat_type === 'group' && a.chat_id === group.id) || false,
          description: group.description || "",
          inviteLink: group.invite_link || undefined,
          lastActivityAt: latestMessage?.created_at || group.created_at,
          mutedUntil: mutes?.find(m => m.chat_type === 'group' && m.chat_id === group.id)?.muted_until ?? null,
        });

        // Store group metadata
        const admins = allMembers?.filter(m => m.group_id === group.id && m.role === "admin").map(m => m.user_id) || [];
        setGroupMetadata(prev => ({
          ...prev,
          [group.id]: {
            settings: {
              admins: admins,
              sendPermission: "everyone" as const,
              editGroupInfoPermission: "admins" as const,
            },
            inviteLink: `https://example.com/join/${group.id}`,
            createdAt: group.created_at,
            createdBy: group.created_by,
          },
        }));
      }

      // Fetch direct message conversations
      const { data: directMessages, error: dmError } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (dmError) throw dmError;

      // Group direct messages by conversation partner
      const dmConversations = new Map<string, typeof directMessages>();
      directMessages?.forEach(dm => {
        const partnerId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id;
        if (!dmConversations.has(partnerId)) {
          dmConversations.set(partnerId, []);
        }
        dmConversations.get(partnerId)?.push(dm);
      });

      // Collect all user IDs to fetch profiles
      const allUserIds = new Set<string>();
      groupMemberships?.forEach(m => {
        if (m.study_groups) allUserIds.add(m.study_groups.created_by);
      });
      allMembers?.forEach(m => allUserIds.add(m.user_id));
      dmConversations.forEach((_, partnerId) => allUserIds.add(partnerId));
      
      const profiles = await fetchUserProfiles(Array.from(allUserIds));

      // Re-process group summaries with profile data if needed (e.g. for created_by)
      // For now, we focus on DMs

      // Create chat summaries for direct messages
      for (const [partnerId, messages] of dmConversations) {
        const latestMsg = messages[0];
        let unreadCount = messages.filter(m => m.receiver_id === user.id && !m.is_read).length;
        const forceUnread = unreadOverrides?.some(u => u.chat_type === 'direct' && u.chat_id === partnerId && u.force_unread);
        if (forceUnread) unreadCount = Math.max(unreadCount, 1);

        const partnerProfile = profiles[partnerId];

        chatSummaries.push({
          id: `dm-${partnerId}`,
          type: "direct",
          title: partnerProfile?.name || `User ${partnerId.slice(0,6)}`,
          subtitle: "Direct Message",
          avatarUrl: partnerProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerId}`,
          participants: [user.id, partnerId],
          lastMessageId: latestMsg.id,
          unreadCount: unreadCount,
          pinned: pinnedChats?.some(p => p.chat_type === 'direct' && p.chat_id === partnerId) || false,
          archived: archives?.some(a => a.chat_type === 'direct' && a.chat_id === partnerId) || false,
          lastActivityAt: latestMsg.created_at,
          mutedUntil: mutes?.find(m => m.chat_type === 'direct' && m.chat_id === partnerId)?.muted_until ?? null,
        });
      }

      setChats(chatSummaries);
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error("Error fetching chats:", error);
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, fetchUserProfiles]);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId: string) => {
    if (!user?.id) return;

    try {
      let fetchedMessages: Message[] = [];
      const senderIds = new Set<string>();

      if (chatId.startsWith("dm-")) {
        // Direct message conversation
        const partnerId = chatId.replace("dm-", "");
        const { data: dms, error } = await supabase
          .from("direct_messages")
          .select("*, reply_to_message_id")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (error) throw error;
        
        // Collect sender IDs
        dms?.forEach(dm => {
          if (dm.sender_id !== user.id) senderIds.add(dm.sender_id);
        });
        
        const replyToIds = dms?.map(m => m.reply_to_message_id).filter(Boolean) as string[] || [];
        let repliedToMessages: Record<string, { senderId: string; body: string; }> = {};

        if (replyToIds.length > 0) {
          const { data: repliedDms } = await supabase
            .from("direct_messages")
            .select("id, encrypted_content, sender_id")
            .in("id", replyToIds);
          
          if (repliedDms) {
            repliedDms.forEach(msg => {
              if (msg.sender_id !== user.id) senderIds.add(msg.sender_id);
            });
            
            repliedToMessages = repliedDms.reduce((acc, msg) => {
              acc[msg.id] = { senderId: msg.sender_id, body: msg.encrypted_content || '' };
              return acc;
            }, {} as Record<string, { senderId: string; body: string; }>);
          }
        }

        // Fetch user profiles for all senders
        await fetchUserProfiles(Array.from(senderIds));

        // Fetch reactions for these messages
        const dmMessageIds = dms?.map(m => m.id) || [];
        const { data: dmReactions } = await supabase
          .from("message_reactions")
          .select("*")
          .eq("chat_type", "direct")
          .in("message_id", dmMessageIds);

        fetchedMessages = dms?.map(dm => {
          const dmMsgReactions = dmReactions?.filter(r => r.message_id === dm.id).map(r => ({
            emoji: r.reaction,
            userId: r.user_id,
            reactedAt: r.created_at || new Date().toISOString(),
          })) || [];
          
          return {
            id: dm.id,
            chatId: chatId,
            senderId: dm.sender_id === user.id ? CURRENT_USER_ID : dm.sender_id,
            kind: dm.message_type === "text" ? "text" : "media",
            body: dm.encrypted_content || "",
            attachments: dm.file_url ? [{
              id: createId(),
              type: mapDBTypeToAttachmentType(dm.message_type, dm.file_name),
              url: dm.file_url,
              fileName: dm.file_name || undefined,
              fileSize: dm.file_size ? `${(dm.file_size / 1024 / 1024).toFixed(2)} MB` : undefined,
            }] : undefined,
            timeline: {
              sentAt: dm.created_at,
              deliveredAt: dm.created_at,
              readAt: dm.is_read ? dm.created_at : undefined,
            },
            status: dm.is_read ? "read" : "delivered",
            reactions: dmMsgReactions,
            replyTo: dm.reply_to_message_id && repliedToMessages[dm.reply_to_message_id]
              ? {
                  messageId: dm.reply_to_message_id,
                  senderId: repliedToMessages[dm.reply_to_message_id].senderId,
                  body: repliedToMessages[dm.reply_to_message_id].body,
                }
              : undefined,
            isPinned: dm.is_pinned_by_sender || dm.is_pinned_by_receiver,
            editedAt: dm.edited_at || undefined,
          };
        }) || [];
      } else {
        // Group conversation
        if (!chatId || chatId === 'undefined' || chatId === 'null') {
          console.error('[useConversations] Invalid group_id:', chatId);
          throw new Error('Invalid group ID');
        }

        const { data: groupMsgs, error } = await supabase
          .from("group_messages")
          .select("id, group_id, sender_id, encrypted_content, message_type, file_url, file_name, file_size, created_at, reply_to_message_id, is_pinned, edited_at")
          .eq("group_id", chatId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        if (error) {
          console.error(`[useConversations] Error fetching group messages for ${chatId}:`, {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            query: {
              table: 'group_messages',
              group_id: chatId,
            }
          });
          throw error;
        }

        // Collect sender IDs
        groupMsgs?.forEach(msg => {
          if (msg.sender_id !== user.id) senderIds.add(msg.sender_id);
        });

        const replyToIds = groupMsgs?.map(m => m.reply_to_message_id).filter(Boolean) as string[] || [];
        let repliedToMessages: Record<string, { senderId: string; body: string; }> = {};

        if (replyToIds.length > 0) {
          const { data: repliedMsgs } = await supabase
            .from("group_messages")
            .select("id, encrypted_content, sender_id")
            .in("id", replyToIds);
          
          if (repliedMsgs) {
            repliedMsgs.forEach(msg => {
              if (msg.sender_id !== user.id) senderIds.add(msg.sender_id);
            });
            
            repliedToMessages = repliedMsgs.reduce((acc, msg) => {
              acc[msg.id] = { senderId: msg.sender_id, body: msg.encrypted_content || '' };
              return acc;
            }, {} as Record<string, { senderId: string; body: string; }>);
          }
        }

        // Fetch user profiles for all senders
        await fetchUserProfiles(Array.from(senderIds));

        // Fetch read receipts for these messages
        const messageIds = groupMsgs?.map(m => m.id) || [];
        const { data: reads } = await supabase
          .from("message_reads")
          .select("*")
          .in("message_id", messageIds);

        // Fetch reactions for these messages
        const { data: reactions } = await supabase
          .from("message_reactions")
          .select("*")
          .eq("chat_type", "group")
          .in("message_id", messageIds);

        fetchedMessages = groupMsgs?.map(msg => {
          const msgReads = reads?.filter(r => r.message_id === msg.id) || [];
          const isRead = msgReads.some(r => r.user_id === user.id);
          const msgReactions = reactions?.filter(r => r.message_id === msg.id).map(r => ({
            emoji: r.reaction,
            userId: r.user_id,
            reactedAt: r.created_at || new Date().toISOString(),
          })) || [];
          
          return {
            id: msg.id,
            chatId: chatId,
            senderId: msg.sender_id === user.id ? CURRENT_USER_ID : msg.sender_id,
            kind: msg.message_type === "text" ? "text" : "media",
            body: msg.encrypted_content || "",
            attachments: msg.file_url ? [{
              id: createId(),
              type: mapDBTypeToAttachmentType(msg.message_type, msg.file_name),
              url: msg.file_url,
              fileName: msg.file_name || undefined,
              fileSize: msg.file_size ? `${(msg.file_size / 1024 / 1024).toFixed(2)} MB` : undefined,
            }] : undefined,
            timeline: {
              sentAt: msg.created_at,
              deliveredAt: msg.created_at,
              readAt: isRead ? msg.created_at : undefined,
            },
            status: isRead ? "read" : "delivered",
            reactions: msgReactions,
            replyTo: msg.reply_to_message_id && repliedToMessages[msg.reply_to_message_id]
              ? {
                  messageId: msg.reply_to_message_id,
                  senderId: repliedToMessages[msg.reply_to_message_id].senderId,
                  body: repliedToMessages[msg.reply_to_message_id].body,
                }
              : undefined,
            isPinned: msg.is_pinned,
            editedAt: msg.edited_at || undefined,
          };
        }) || [];
      }

      setMessages(prev => ({
        ...prev,
        [chatId]: fetchedMessages,
      }));
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive",
      });
    }
  }, [user, toast, fetchUserProfiles]);

  // Send a new message
  const sendMessage = useCallback(async (
    chatId: string,
    body: string,
    attachments?: Attachment[],
    replyToMessageId?: string
  ) => {
    if (!user?.id) return;

    try {
      const dbMessageType = mapAttachmentTypeToDBType(attachments?.[0]?.type);
      
      if (chatId.startsWith("dm-")) {
        // Send direct message
        const partnerId = chatId.replace("dm-", "");
        const { data, error } = await supabase
          .from("direct_messages")
          .insert({
            sender_id: user.id,
            receiver_id: partnerId,
            encrypted_content: body,
            message_type: dbMessageType,
            file_url: attachments?.[0]?.url,
            file_name: attachments?.[0]?.fileName,
            file_size: attachments?.[0]?.fileSize ? parseInt(attachments[0].fileSize.replace(/[^0-9]/g, '')) : null,
            reply_to_message_id: replyToMessageId,
          })
          .select()
          .single();

        if (error) throw error;
      } else {
        // Send group message
        const { data, error } = await supabase
          .from("group_messages")
          .insert({
            group_id: chatId,
            sender_id: user.id,
            encrypted_content: body,
            message_type: dbMessageType,
            file_url: attachments?.[0]?.url,
            file_name: attachments?.[0]?.fileName,
            file_size: attachments?.[0]?.fileSize ? parseInt(attachments[0].fileSize.replace(/[^0-9]/g, '')) : null,
            reply_to_message_id: replyToMessageId,
          })
          .select("id, group_id, sender_id, encrypted_content, message_type, created_at")
          .single();

        if (error) throw error;
      }

      // Refresh messages
      await fetchMessages(chatId);
      await fetchChats();
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive",
      });
    }
  }, [user, fetchMessages, fetchChats, toast]);

  // Mark message as read
  const markAsRead = useCallback(async (chatId: string, messageId: string) => {
    if (!user?.id) return;

    try {
      if (chatId.startsWith("dm-")) {
        // Mark direct message as read
        await supabase
          .from("direct_messages")
          .update({ is_read: true })
          .eq("id", messageId);
      } else {
        // Mark group message as read - use upsert to avoid conflicts
        await supabase
          .from("message_reads")
          .upsert({
            message_id: messageId,
            user_id: user.id,
          }, {
            onConflict: 'message_id,user_id',
            ignoreDuplicates: true
          });
      }

      await fetchChats();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  }, [user, fetchChats]);

  // Mark all messages in a chat as read
  const markAllAsRead = useCallback(async (chatId: string) => {
    if (!user?.id) return;

    try {
      if (chatId.startsWith("dm-")) {
        // Mark all direct messages with this partner as read
        const partnerId = chatId.replace("dm-", "");
        await supabase
          .from("direct_messages")
          .update({ is_read: true })
          .or(`and(sender_id.eq.${partnerId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${partnerId})`)
          .eq("receiver_id", user.id);
      } else {
        // Get all group messages
        const { data: groupMessages } = await supabase
          .from("group_messages")
          .select("id")
          .eq("group_id", chatId);

        if (groupMessages && groupMessages.length > 0) {
          // Mark all group messages as read - use upsert to avoid conflicts
          const reads = groupMessages.map(msg => ({
            message_id: msg.id,
            user_id: user.id,
          }));

          await supabase
            .from("message_reads")
            .upsert(reads, {
              onConflict: 'message_id,user_id',
              ignoreDuplicates: true
            });
        }
      }

      await fetchChats();
    } catch (error) {
      console.error("Error marking all messages as read:", error);
    }
  }, [user, fetchChats]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const groupChannel = supabase
      .channel("group_messages_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_messages" },
        () => {
          fetchChats();
          if (selectedChatId && !selectedChatId.startsWith("dm-")) {
            fetchMessages(selectedChatId);
          }
        }
      )
      .subscribe();

    const dmChannel = supabase
      .channel("direct_messages_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        () => {
          fetchChats();
          if (selectedChatId?.startsWith("dm-")) {
            fetchMessages(selectedChatId);
          }
        }
      )
      .subscribe();

    return () => {
      groupChannel.unsubscribe();
      dmChannel.unsubscribe();
    };
  }, [user, selectedChatId, fetchChats, fetchMessages]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchChats();
    }
  }, [user, fetchChats]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId, fetchMessages]);

  useEffect(() => {
    if (!selectedChatId) return;

    const channel = supabase.channel(`typing-${selectedChatId}`);

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setTypingIndicators(prev => ({
            ...prev,
            [selectedChatId]: [
              ...(prev[selectedChatId] || []).filter(t => t.userId !== payload.userId),
              { userId: payload.userId, lastTyped: Date.now() }
            ]
          }));
        }
      })
      .subscribe();

    const interval = setInterval(() => {
      setTypingIndicators(prev => {
        const now = Date.now();
        const newIndicators = { ...prev };
        if (newIndicators[selectedChatId]) {
          newIndicators[selectedChatId] = newIndicators[selectedChatId].filter(
            t => now - t.lastTyped < 5000 // 5 seconds threshold
          );
        }
        return newIndicators;
      });
    }, 2000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [selectedChatId, user?.id]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) || null,
    [chats, selectedChatId]
  );

  const currentMessages = useMemo(
    () => (selectedChatId ? messages[selectedChatId] || [] : []),
    [selectedChatId, messages]
  );

  // Toggle reaction on a message
  const toggleReaction = useCallback(async (chatId: string, messageId: string, emoji: string) => {
    if (!user?.id) return;

    try {
      const chatType = chatId.startsWith("dm-") ? "direct" : "group";
      
      // Check if reaction already exists
      const { data: existing } = await supabase
        .from("message_reactions")
        .select("*")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("reaction", emoji)
        .eq("chat_type", chatType)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existing.id);
      } else {
        // Add reaction
        await supabase
          .from("message_reactions")
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction: emoji,
            chat_type: chatType,
          });
      }

      await fetchMessages(chatId);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  }, [user, fetchMessages, toast]);

  // Toggle starred status of a message
  const toggleStarred = useCallback(async (chatId: string, messageId: string) => {
    if (!user?.id) return;

    try {
      const chatType = chatId.startsWith("dm-") ? "direct" : "group";
      
      // Check if already starred
      const { data: existing } = await supabase
        .from("starred_messages")
        .select("*")
        .eq("user_id", user.id)
        .eq("message_id", messageId)
        .eq("chat_type", chatType)
        .single();

      if (existing) {
        // Unstar
        await supabase
          .from("starred_messages")
          .delete()
          .eq("id", existing.id);
        
        toast({ title: "Message unstarred" });
      } else {
        // Star
        await supabase
          .from("starred_messages")
          .insert({
            user_id: user.id,
            message_id: messageId,
            chat_type: chatType,
          });
        
        toast({ title: "Message starred" });
      }

      await fetchMessages(chatId);
    } catch (error) {
      console.error("Error toggling starred:", error);
      toast({
        title: "Error",
        description: "Failed to star message",
        variant: "destructive",
      });
    }
  }, [user, fetchMessages, toast]);

  // Delete a message
  const deleteMessage = useCallback(async (chatId: string, messageId: string, scope: "me" | "everyone") => {
    if (!user?.id) return;

    try {
      if (chatId.startsWith("dm-")) {
        // Direct message deletion
        const { data: msg } = await supabase
          .from("direct_messages")
          .select("*")
          .eq("id", messageId)
          .single();

        if (msg) {
          if (scope === "everyone" && msg.sender_id === user.id) {
            // Delete for everyone (soft delete)
            await supabase
              .from("direct_messages")
              .update({
                deleted_by_sender: true,
                deleted_by_receiver: true,
              })
              .eq("id", messageId);
          } else {
            // Delete for me only
            const field = msg.sender_id === user.id ? "deleted_by_sender" : "deleted_by_receiver";
            await supabase
              .from("direct_messages")
              .update({ [field]: true })
              .eq("id", messageId);
          }
        }
      } else {
        // Group message deletion
        if (scope === "everyone") {
          await supabase
            .from("group_messages")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", messageId)
            .eq("sender_id", user.id); // Only sender can delete for everyone
        }
      }

      await fetchMessages(chatId);
      toast({ title: scope === "everyone" ? "Message deleted for everyone" : "Message deleted" });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  }, [user, fetchMessages, toast]);

  // Edit a message
  const editMessage = useCallback(async (chatId: string, messageId: string, newText: string) => {
    if (!user?.id) return;

    try {
      if (chatId.startsWith("dm-")) {
        await supabase
          .from("direct_messages")
          .update({
            encrypted_content: newText,
            edited_at: new Date().toISOString(),
          })
          .eq("id", messageId)
          .eq("sender_id", user.id);
      } else {
        await supabase
          .from("group_messages")
          .update({
            encrypted_content: newText,
            edited_at: new Date().toISOString(),
          })
          .eq("id", messageId)
          .eq("sender_id", user.id);
      }

      await fetchMessages(chatId);
      toast({ title: "Message edited" });
    } catch (error) {
      console.error("Error editing message:", error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive",
      });
    }
  }, [user, fetchMessages, toast]);

  // Forward a message to another chat
  const forwardMessage = useCallback(async (fromChatId: string, messageId: string, toChatId: string) => {
    if (!user?.id) return;

    try {
      // Get original message
      let originalMessage: { encrypted_content: string; message_type: string; file_url?: string; file_name?: string; file_size?: number } | null = null;
      
      if (fromChatId.startsWith("dm-")) {
        const { data } = await supabase
          .from("direct_messages")
          .select("*")
          .eq("id", messageId)
          .single();
        originalMessage = data;
      } else {
        const { data } = await supabase
          .from("group_messages")
          .select("*")
          .eq("id", messageId)
          .single();
        originalMessage = data;
      }

      if (!originalMessage) throw new Error("Message not found");

      // Create new message in target chat with forwarded flag
      if (toChatId.startsWith("dm-")) {
        const partnerId = toChatId.replace("dm-", "");
        await supabase
          .from("direct_messages")
          .insert({
            sender_id: user.id,
            receiver_id: partnerId,
            encrypted_content: originalMessage.encrypted_content,
            message_type: originalMessage.message_type,
            file_url: originalMessage.file_url,
            file_name: originalMessage.file_name,
            file_size: originalMessage.file_size,
            forwarded_from_message_id: messageId,
          });
      } else {
        await supabase
          .from("group_messages")
          .insert({
            group_id: toChatId,
            sender_id: user.id,
            encrypted_content: originalMessage.encrypted_content,
            message_type: originalMessage.message_type,
            file_url: originalMessage.file_url,
            file_name: originalMessage.file_name,
            file_size: originalMessage.file_size,
            forwarded_from_message_id: messageId,
          });
      }

      await fetchChats();
      toast({ title: "Message forwarded" });
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast({
        title: "Error",
        description: "Failed to forward message",
        variant: "destructive",
      });
    }
  }, [user, fetchChats, toast]);

  // Pin/unpin a message
  const markMessagePinned = useCallback(async (chatId: string, messageId: string, pinned: boolean) => {
    if (!user?.id) return;

    try {
      if (chatId.startsWith("dm-")) {
        // For DMs, each user can pin for themselves
        const { data: msg } = await supabase
          .from("direct_messages")
          .select("*")
          .eq("id", messageId)
          .single();

        if (msg) {
          const field = msg.sender_id === user.id ? "is_pinned_by_sender" : "is_pinned_by_receiver";
          await supabase
            .from("direct_messages")
            .update({ [field]: pinned })
            .eq("id", messageId);
        }
      } else {
        // For groups, pinning is for everyone
        await supabase
          .from("group_messages")
          .update({ is_pinned: pinned })
          .eq("id", messageId);
      }

      await fetchMessages(chatId);
      toast({ title: pinned ? "Message pinned" : "Message unpinned" });
    } catch (error) {
      console.error("Error pinning message:", error);
      toast({
        title: "Error",
        description: "Failed to pin message",
        variant: "destructive",
      });
    }
  }, [user, fetchMessages, toast]);

  // Create a poll
  const createPoll = useCallback(async (
    chatId: string,
    question: string,
    options: string[],
    allowMultiple: boolean
  ) => {
    if (!user?.id) return;

    try {
      const chatType = chatId.startsWith("dm-") ? "direct" : "group";
      const actualChatId = chatId.startsWith("dm-") ? chatId.replace("dm-", "") : chatId;
      
      const pollOptions = options.map((text, index) => ({
        id: `opt-${index}`,
        text,
        votes: [],
      }));

      await supabase
        .from("polls")
        .insert({
          chat_id: actualChatId,
          chat_type: chatType,
          created_by: user.id,
          question,
          options: pollOptions,
          allow_multiple: allowMultiple,
        });

      await fetchChats();
      toast({ title: "Poll created" });
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive",
      });
    }
  }, [user, fetchChats, toast]);

  // Start a call
  const startCall = useCallback(async (chatId: string, callType: "voice" | "video") => {
    if (!user?.id) return;

    try {
      const chatType = chatId.startsWith("dm-") ? "direct" : "group";
      const actualChatId = chatId.startsWith("dm-") ? chatId.replace("dm-", "") : chatId;
      
      await supabase
        .from("call_records")
        .insert({
          chat_id: actualChatId,
          chat_type: chatType,
          call_type: callType,
          initiated_by: user.id,
          participants: [user.id],
          status: "ringing",
        });

      toast({ title: `${callType === "voice" ? "Voice" : "Video"} call started` });
      
      // Navigate to call page
      window.location.href = `/call?conversationId=${actualChatId}&type=${callType}`;
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Error",
        description: "Failed to start call",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Export chat history
  const exportChat = useCallback(async (chatId: string, includeMedia: boolean) => {
    if (!user?.id) return;

    try {
      const chatMessages = messages[chatId] || [];
      
      const exportData = {
        chatId,
        exportedAt: new Date().toISOString(),
        exportedBy: user.id,
        includeMedia,
        messages: chatMessages.map(msg => ({
          id: msg.id,
          sender: msg.senderId,
          body: msg.body,
          timestamp: msg.timeline.sentAt,
          attachments: includeMedia ? msg.attachments : undefined,
        })),
      };

      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-export-${chatId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Chat exported successfully" });
    } catch (error) {
      console.error("Error exporting chat:", error);
      toast({
        title: "Error",
        description: "Failed to export chat",
        variant: "destructive",
      });
    }
  }, [user, messages, toast]);

  // Update group settings
  const updateGroupSettings = useCallback(async (
    groupId: string,
    settings: Partial<{ sendPermission: string; editGroupInfoPermission: string }>
  ) => {
    if (!user?.id) return;

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from("group_settings")
        .select("*")
        .eq("group_id", groupId)
        .single();

      if (existing) {
        await supabase
          .from("group_settings")
          .update({
            send_permission: settings.sendPermission,
            edit_info_permission: settings.editGroupInfoPermission,
            updated_at: new Date().toISOString(),
          })
          .eq("group_id", groupId);
      } else {
        await supabase
          .from("group_settings")
          .insert({
            group_id: groupId,
            send_permission: settings.sendPermission || "everyone",
            edit_info_permission: settings.editGroupInfoPermission || "admins",
          });
      }

      await fetchChats();
      toast({ title: "Group settings updated" });
    } catch (error) {
      console.error("Error updating group settings:", error);
      toast({
        title: "Error",
        description: "Failed to update group settings",
        variant: "destructive",
      });
    }
  }, [user, fetchChats, toast]);

  // Update disappearing message settings
  const updateDisappearing = useCallback(async (
    chatId: string,
    settings: { mode: string; updatedBy: string; lastUpdatedAt: string }
  ) => {
    if (!user?.id) return;

    try {
      const chatType = chatId.startsWith("dm-") ? "direct" : "group";
      const actualChatId = chatId.startsWith("dm-") ? chatId.replace("dm-", "") : chatId;
      
      // Check if settings exist
      const { data: existing } = await supabase
        .from("disappearing_settings")
        .select("*")
        .eq("chat_id", actualChatId)
        .eq("chat_type", chatType)
        .single();

      if (existing) {
        await supabase
          .from("disappearing_settings")
          .update({
            mode: settings.mode,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("disappearing_settings")
          .insert({
            chat_id: actualChatId,
            chat_type: chatType,
            mode: settings.mode,
            updated_by: user.id,
          });
      }

      toast({ title: "Disappearing messages updated" });
    } catch (error) {
      console.error("Error updating disappearing settings:", error);
      toast({
        title: "Error",
        description: "Failed to update disappearing settings",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Pin/unpin chat
  const togglePinChat = useCallback(async (chatId: string) => {
    if (!user?.id) return;

    try {
      const chatType = chatId.startsWith("dm-") ? "direct" : "group";
      const actualChatId = chatId.startsWith("dm-") ? chatId.replace("dm-", "") : chatId;
      
      // Check if already pinned
      const { data: existing } = await supabase
        .from("pinned_chats")
        .select("*")
        .eq("user_id", user.id)
        .eq("chat_type", chatType)
        .eq("chat_id", actualChatId)
        .single();

      if (existing) {
        // Unpin
        await supabase
          .from("pinned_chats")
          .delete()
          .eq("id", existing.id);
        
        toast({ title: "Chat unpinned" });
      } else {
        // Pin
        await supabase
          .from("pinned_chats")
          .insert({
            user_id: user.id,
            chat_type: chatType,
            chat_id: actualChatId,
          });
        
        toast({ title: "Chat pinned" });
      }

      await fetchChats();
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast({
        title: "Error",
        description: "Failed to pin chat",
        variant: "destructive",
      });
    }
  }, [user, fetchChats, toast]);

  // Mute/unmute chat
  const muteChat = useCallback(async (chatId: string, duration?: "8h" | "1w" | "always" | "off") => {
    if (!user?.id) return;
    try {
      const chatType = chatId.startsWith("dm-") ? "direct" : "group";
      const actualChatId = chatId.startsWith("dm-") ? chatId.replace("dm-", "") : chatId;

      if (duration === "off") {
        await supabase
          .from("muted_chats")
          .delete()
          .eq("user_id", user.id)
          .eq("chat_type", chatType)
          .eq("chat_id", actualChatId);
        toast({ title: "Notifications unmuted" });
      } else {
        const until = (() => {
          const now = new Date();
          if (duration === "8h") return new Date(now.getTime() + 8*60*60*1000).toISOString();
          if (duration === "1w") return new Date(now.getTime() + 7*24*60*60*1000).toISOString();
          return null; // always
        })();
        await supabase
          .from("muted_chats")
          .upsert({
            user_id: user.id,
            chat_type: chatType,
            chat_id: actualChatId,
            muted_until: until,
          }, { onConflict: "user_id,chat_type,chat_id" });
        toast({ title: "Chat muted" });
      }
      await fetchChats();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to update mute", variant: "destructive" });
    }
  }, [user, fetchChats, toast]);

  const toggleArchive = useCallback(async (chatId: string) => {
    if (!user?.id) return;
    try {
      const chatType = chatId.startsWith("dm-") ? "direct" : "group";
      const actualChatId = chatId.startsWith("dm-") ? chatId.replace("dm-", "") : chatId;

      const { data: existing } = await supabase
        .from("archived_chats")
        .select("*")
        .eq("user_id", user.id)
        .eq("chat_type", chatType)
        .eq("chat_id", actualChatId)
        .single();

      if (existing) {
        await supabase
          .from("archived_chats")
          .delete()
          .eq("id", existing.id);
        toast({ title: "Chat unarchived" });
      } else {
        await supabase
          .from("archived_chats")
          .insert({ user_id: user.id, chat_type: chatType, chat_id: actualChatId });
        toast({ title: "Chat archived" });
      }
      await fetchChats();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to toggle archive", variant: "destructive" });
    }
  }, [user, fetchChats, toast]);

  const toggleMarkUnread = useCallback(async (chatId: string) => {
    if (!user?.id) return;
    try {
      const chatType = chatId.startsWith("dm-") ? "direct" : "group";
      const actualChatId = chatId.startsWith("dm-") ? chatId.replace("dm-", "") : chatId;
      const { data: existing } = await supabase
        .from("unread_overrides")
        .select("*")
        .eq("user_id", user.id)
        .eq("chat_type", chatType)
        .eq("chat_id", actualChatId)
        .single();
      if (existing) {
        await supabase
          .from("unread_overrides")
          .delete()
          .eq("user_id", user.id)
          .eq("chat_type", chatType)
          .eq("chat_id", actualChatId);
        toast({ title: "Marked as read" });
      } else {
        await supabase
          .from("unread_overrides")
          .upsert({ user_id: user.id, chat_type: chatType, chat_id: actualChatId, force_unread: true });
        toast({ title: "Marked as unread" });
      }
      await fetchChats();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to toggle unread", variant: "destructive" });
    }
  }, [user, fetchChats, toast]);

  const createGroup = useCallback(async (name: string, description?: string) => {
    if (!user?.id) return null;
    try {
      const { data: group, error } = await supabase
        .from('study_groups')
        .insert({ name, description: description ?? '', created_by: user.id })
        .select('*')
        .single();
      if (error) throw error;
      await supabase
        .from('study_group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'admin' });
      await fetchChats();
      return group.id as string;
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to create group', variant: 'destructive' });
      return null;
    }
  }, [user, fetchChats, toast]);

  // Generate invite link for a group
  const generateInviteLink = useCallback(async (
    groupId: string,
    expiresInHours = 168, // Default 7 days
    maxUses?: number
  ) => {
    if (!user?.id) return null;

    try {
      // Check if the RPC function exists, if not, generate a simple invite code
      const { data, error } = await supabase.rpc('create_group_invite_link', {
        p_group_id: groupId,
        p_expires_in_hours: expiresInHours,
        p_max_uses: maxUses
      });

      if (error) {
        console.error("RPC error:", error);
        
        // Fallback: If RPC doesn't exist, create a simple invite link manually
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const inviteLink = `${window.location.origin}/join/${inviteCode}`;
        
        // Update the group with invite info
        await supabase
          .from('study_groups')
          .update({
            invite_code: inviteCode,
            invite_link: inviteLink,
            invite_expires_at: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
          })
          .eq('id', groupId);

        toast({
          title: "Invite link generated",
          description: `Expires in ${expiresInHours} hours`,
        });

        await fetchChats();

        return {
          code: inviteCode,
          link: inviteLink,
          expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
        };
      }

      // The data from rpc is not always an array. If it's a single object, wrap it.
      const inviteDataArray = Array.isArray(data) ? data : [data];

      if (inviteDataArray && inviteDataArray.length > 0) {
        const inviteData = inviteDataArray[0];
        toast({
          title: "Invite link generated",
          description: `Expires in ${expiresInHours} hours`,
        });

        // Refresh chats to get updated invite link
        await fetchChats();

        return {
          code: inviteData.invite_code,
          link: inviteData.invite_link,
          expiresAt: inviteData.expires_at,
        };
      }

      return null;
    } catch (error) {
      console.error("Error generating invite link:", error);
      toast({
        title: "Error",
        description: "Failed to generate invite link",
        variant: "destructive",
      });
      return null;
    }
  }, [user, fetchChats, toast]);

  // Join group via invite code
  const joinViaInvite = useCallback(async (inviteCode: string) => {
    if (!user?.id) return null;

    try {
      const trimmedCode = inviteCode.toUpperCase().trim();
      
      // Try RPC function first
      const { data, error } = await supabase.rpc('join_group_via_invite', {
        p_invite_code: trimmedCode,
        p_user_id: user.id
      });

      // If RPC exists and works
      if (!error && data) {
        const resultArray = Array.isArray(data) ? data : [data];

        if (resultArray && resultArray.length > 0) {
          const result = resultArray[0];

          if (result.success) {
            toast({
              title: "Success!",
              description: result.message,
            });

            await fetchChats();

            return {
              success: true,
              groupId: result.group_id,
              groupName: result.group_name,
            };
          } else {
            toast({
              title: "Unable to join",
              description: result.message,
              variant: "destructive",
            });

            return {
              success: false,
              message: result.message,
            };
          }
        }
      }
      
      // Fallback: Manual join if RPC doesn't exist or fails
      console.log("Using fallback join method for code:", trimmedCode);
      
      // Find the group by invite code
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('invite_code', trimmedCode)
        .single();

      if (groupError || !group) {
        console.error("Group lookup error:", groupError);
        toast({
          title: "Invalid code",
          description: "The invite code is invalid or expired",
          variant: "destructive",
        });
        return { success: false, message: "Invalid invite code" };
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You're already in this group",
        });
        
        await fetchChats();
        
        return {
          success: true,
          groupId: group.id,
          groupName: group.name,
        };
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('study_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) {
        console.error("Join error:", joinError);
        throw joinError;
      }

      toast({
        title: "Success!",
        description: `You joined ${group.name}`,
      });

      await fetchChats();

      return {
        success: true,
        groupId: group.id,
        groupName: group.name,
      };

    } catch (error) {
      console.error("Error joining via invite:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join group",
        variant: "destructive",
      });
      return { success: false, message: "Failed to join group" };
    }
  }, [user, fetchChats, toast]);

  // Revoke/regenerate invite link
  const regenerateInviteLink = useCallback(async (groupId: string) => {
    return await generateInviteLink(groupId);
  }, [generateInviteLink]);

  // Clear chat history
  const clearChatHistory = useCallback(async (chatId: string) => {
    if (!user?.id) return;

    try {
      if (chatId.startsWith("dm-")) {
        const partnerId = chatId.replace("dm-", "");
        // Delete all direct messages between these users
        await supabase
          .from("direct_messages")
          .delete()
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`);
      } else {
        // Soft delete all group messages
        await supabase
          .from("group_messages")
          .update({ deleted_at: new Date().toISOString() })
          .eq("group_id", chatId);
      }

      // Clear local messages
      setMessages(prev => ({
        ...prev,
        [chatId]: [],
      }));

      toast({
        title: "Chat cleared",
        description: "All messages have been deleted",
      });

      await fetchChats();
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast({
        title: "Error",
        description: "Failed to clear chat history",
        variant: "destructive",
      });
    }
  }, [user, fetchChats, toast]);

  const leaveGroup = useCallback(async (groupId: string) => {
    if (!user?.id) return;
    
    try {
      // Remove user from group members
      const { error } = await supabase
        .from("study_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Left group",
        description: "You have left the group",
      });

      // Clear selection if this was the selected chat
      if (selectedChatId === groupId) {
        setSelectedChatId(null);
      }

      await fetchChats();
    } catch (error) {
      console.error("Error leaving group:", error);
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      });
    }
  }, [user, selectedChatId, fetchChats, toast]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!user?.id) return;

    try {
      const isDirectMessage = chatId.startsWith("dm-");
      
      if (isDirectMessage) {
        // For direct messages, delete all messages in the conversation
        const partnerId = chatId.replace("dm-", "");
        
        await supabase
          .from("direct_messages")
          .delete()
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`);

        toast({
          title: "Chat deleted",
          description: "Direct message conversation has been deleted",
        });
      } else {
        // For groups, leave the group (which removes from chat list)
        await leaveGroup(chatId);
        return; // leaveGroup handles the toast and refresh
      }

      // Clear selection if this was the selected chat
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }

      await fetchChats();
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    }
  }, [user, selectedChatId, leaveGroup, fetchChats, toast]);

  const startDirectMessage = useCallback(async (emailOrUsername: string) => {
    if (!user?.id) return null;

    try {
      // Search for user by email
      const { data: foundUsers, error } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, email")
        .eq('email', emailOrUsername) as any;

      if (error) throw error;

      if (!foundUsers || foundUsers.length === 0) {
        toast({
          title: "User not found",
          description: "No user found with that email",
          variant: "destructive",
        });
        return null;
      }

      const targetUser = foundUsers[0] as any;
      
      // Check if user is trying to message themselves
      if (targetUser.id === user.id) {
        toast({
          title: "Invalid action",
          description: "You cannot message yourself",
          variant: "destructive",
        });
        return null;
      }

      // Create or select the DM chat
      const dmChatId = `dm-${targetUser.id}`;
      
      // Add user profile to cache if not already there
      if (!userProfiles[targetUser.id]) {
        setUserProfiles(prev => ({
          ...prev,
          [targetUser.id]: {
            id: targetUser.id,
            name: targetUser.full_name || `User ${targetUser.id.slice(0, 6)}`,
            avatarUrl: targetUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}`,
          }
        }));
      }

      await fetchChats();
      setSelectedChatId(dmChatId);

      toast({
        title: "Chat opened",
        description: `You can now message ${targetUser.full_name || 'this user'}`,
      });

      return dmChatId;
    } catch (error) {
      console.error("Error starting direct message:", error);
      toast({
        title: "Error",
        description: "Failed to start direct message",
        variant: "destructive",
      });
      return null;
    }
  }, [user, userProfiles, fetchChats, toast]);

  return {
    chats,
    messages,
    groupMetadata,
    userProfiles,
    selectedChatId,
    selectedChat,
    currentMessages,
    isLoading,
    setSelectedChatId,
    createGroup,
    sendMessage,
    markAsRead,
    markAllAsRead,
    refreshChats: fetchChats,
    toggleReaction,
    toggleStarred,
    deleteMessage,
    editMessage,
    forwardMessage,
    markMessagePinned,
    createPoll,
    startCall,
    exportChat,
    updateGroupSettings,
    updateDisappearing,
    togglePinChat,
    toggleArchive,
    toggleMarkUnread,
    muteChat,
    generateInviteLink,
    joinViaInvite,
    regenerateInviteLink,
    typingIndicators,
    broadcastTyping,
    clearChatHistory,
    leaveGroup,
    deleteChat,
    startDirectMessage,
  };
}
