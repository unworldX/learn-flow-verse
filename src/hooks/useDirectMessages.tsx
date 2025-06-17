
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string | null;
  message_type: 'text' | 'image' | 'video' | 'file';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  is_read: boolean;
  sender?: {
    full_name: string | null;
    email: string;
  };
  receiver?: {
    full_name: string | null;
    email: string;
  };
}

export interface ChatUser {
  id: string;
  email: string;
  full_name: string | null;
  last_message?: DirectMessage;
  unread_count: number;
}

export const useDirectMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChatUsers = async () => {
    if (!user) return;

    try {
      // Get all users who have exchanged messages with current user
      const { data: messageData, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:users!sender_id(id, email, full_name),
          receiver:users!receiver_id(id, email, full_name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process chat users
      const userMap = new Map<string, ChatUser>();
      
      messageData?.forEach(msg => {
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        if (otherUser && !userMap.has(otherUser.id)) {
          userMap.set(otherUser.id, {
            id: otherUser.id,
            email: otherUser.email,
            full_name: otherUser.full_name,
            last_message: msg,
            unread_count: 0
          });
        }
      });

      setChatUsers(Array.from(userMap.values()));
    } catch (error) {
      console.error('Error fetching chat users:', error);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:users!sender_id(full_name, email),
          receiver:users!receiver_id(full_name, email)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error loading messages",
        description: "Unable to fetch messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (receiverId: string, content: string, messageType: 'text' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          encrypted_content: content,
          message_type: messageType,
          file_url: fileUrl || null,
          file_name: fileName || null
        });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully"
      });

      fetchMessages(receiverId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchChatUsers();
    }
  }, [user]);

  return {
    messages,
    chatUsers,
    isLoading,
    fetchMessages,
    sendMessage,
    refetch: fetchChatUsers
  };
};
