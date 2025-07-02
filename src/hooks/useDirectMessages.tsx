
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cacheService } from '@/lib/cacheService';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
  is_read: boolean;
  deleted_by_sender: boolean;
  deleted_by_receiver: boolean;
}

export interface ChatUser {
  id: string;
  email: string;
  full_name?: string;
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
      const cacheKey = `chat_users_${user.id}`;
      let cachedUsers = await cacheService.get<ChatUser[]>(cacheKey);
      
      if (cachedUsers) {
        setChatUsers(cachedUsers);
        return;
      }

      // Get users we've had conversations with
      const { data: messageData, error: messageError } = await supabase
        .from('direct_messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (messageError) throw messageError;

      // Extract unique user IDs
      const userIds = new Set<string>();
      messageData?.forEach(msg => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
        if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id);
      });

      if (userIds.size === 0) {
        setChatUsers([]);
        return;
      }

      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', Array.from(userIds));

      if (usersError) throw usersError;

      setChatUsers(users || []);
      await cacheService.set(cacheKey, users || [], { ttlMinutes: 30 });
    } catch (error) {
      console.error('Error fetching chat users:', error);
      toast({
        title: "Error loading conversations",
        description: "Unable to load conversation list",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error loading messages",
        description: "Unable to load messages",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          encrypted_content: content,
          message_type: 'text'
        });

      if (error) throw error;

      // Refresh messages
      await fetchMessages(receiverId);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchChatUsers().finally(() => setIsLoading(false));
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
