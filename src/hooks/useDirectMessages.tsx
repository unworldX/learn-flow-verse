
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
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs from messages
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
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', Array.from(userIds));

      if (usersError) throw usersError;

      // Process chat users
      const userMap = new Map<string, ChatUser>();
      
      usersData?.forEach(userData => {
        const lastMessage = messageData?.find(msg => 
          msg.sender_id === userData.id || msg.receiver_id === userData.id
        );
        
        if (lastMessage) {
          userMap.set(userData.id, {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            last_message: {
              ...lastMessage,
              message_type: lastMessage.message_type as 'text' | 'image' | 'video' | 'file'
            } as DirectMessage,
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
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user details for sender and receiver
      const userIds = new Set<string>();
      data?.forEach(msg => {
        userIds.add(msg.sender_id);
        userIds.add(msg.receiver_id);
      });

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', Array.from(userIds));

      if (usersError) throw usersError;

      // Map messages with user details and proper typing
      const messagesWithUsers = data?.map(msg => ({
        ...msg,
        message_type: msg.message_type as 'text' | 'image' | 'video' | 'file',
        sender: usersData?.find(u => u.id === msg.sender_id),
        receiver: usersData?.find(u => u.id === msg.receiver_id)
      })) || [];

      setMessages(messagesWithUsers as DirectMessage[]);
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
