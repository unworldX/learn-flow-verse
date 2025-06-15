import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Upload, Send, Image, Video, FileText, Search } from 'lucide-react';
import { encryptText, decryptText } from '@/lib/encryption';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content?: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
  is_read: boolean;
}

interface Chat {
  user: User;
  lastMessage?: DirectMessage;
  unreadCount: number;
}

const DirectMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat && user) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [selectedChat, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('direct-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage;
          if (selectedChat && newMessage.sender_id === selectedChat.id) {
            setMessages(prev => [...prev, newMessage]);
            markMessagesAsRead();
          }
          fetchChats(); // Update chat list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .neq('id', user?.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:users!direct_messages_sender_id_fkey(id, email, full_name),
          receiver:users!direct_messages_receiver_id_fkey(id, email, full_name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by chat partner
      const chatMap = new Map<string, Chat>();
      
      for (const message of messagesData || []) {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const partner = message.sender_id === user.id ? message.receiver : message.sender;
        
        if (!chatMap.has(partnerId)) {
          chatMap.set(partnerId, {
            user: partner,
            lastMessage: message,
            unreadCount: 0
          });
        }

        // Count unread messages
        if (message.receiver_id === user.id && !message.is_read) {
          const chat = chatMap.get(partnerId)!;
          chat.unreadCount++;
        }
      }

      setChats(Array.from(chatMap.values()));
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat || !user) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Decrypt text messages
      const decryptedMessages = await Promise.all(
        (data || []).map(async (message) => {
          if (message.message_type === 'text' && message.encrypted_content) {
            return {
              ...message,
              decrypted_content: await decryptText(message.encrypted_content)
            };
          }
          return message;
        })
      );

      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedChat || !user) return;

    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', selectedChat.id)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendTextMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    setLoading(true);
    try {
      const encryptedContent = await encryptText(newMessage);
      
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedChat.id,
          encrypted_content: encryptedContent,
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages();
      await fetchChats();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedChat || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      let messageType: 'image' | 'video' | 'file' = 'file';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('video/')) messageType = 'video';

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedChat.id,
          message_type: messageType,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size
        });

      if (error) throw error;

      await fetchMessages();
      await fetchChats();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = (selectedUser: User) => {
    setSelectedChat(selectedUser);
    setMessages([]);
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMessage = (message: DirectMessage & { decrypted_content?: string }) => {
    const isOwn = message.sender_id === user?.id;
    
    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
        }`}>
          {message.message_type === 'text' ? (
            <p>{message.decrypted_content || message.encrypted_content}</p>
          ) : message.message_type === 'image' ? (
            <div>
              <img src={message.file_url} alt={message.file_name} className="max-w-full rounded" />
              <p className="text-xs mt-1 opacity-75">{message.file_name}</p>
            </div>
          ) : message.message_type === 'video' ? (
            <div>
              <video controls className="max-w-full rounded">
                <source src={message.file_url} />
              </video>
              <p className="text-xs mt-1 opacity-75">{message.file_name}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <a href={message.file_url} download={message.file_name} className="underline">
                {message.file_name}
              </a>
            </div>
          )}
          <p className="text-xs mt-1 opacity-75">
            {new Date(message.created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex">
      {/* Chat List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold mb-4">Direct Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {/* Existing Chats */}
          {chats.map((chat) => (
            <div
              key={chat.user.id}
              onClick={() => setSelectedChat(chat.user)}
              className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                selectedChat?.id === chat.user.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {chat.user.full_name?.[0] || chat.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{chat.user.full_name || chat.user.email}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage?.message_type === 'text' ? 'Text message' : 
                     chat.lastMessage?.message_type === 'image' ? '📷 Image' :
                     chat.lastMessage?.message_type === 'video' ? '🎥 Video' : '📎 File'}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* New Chat Options */}
          {searchQuery && (
            <>
              <Separator className="my-2" />
              <div className="p-2">
                <p className="text-sm font-medium text-gray-500 mb-2">Start new chat</p>
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => startNewChat(user)}
                    className="p-2 cursor-pointer hover:bg-gray-50 rounded flex items-center gap-3"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {user.full_name?.[0] || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.full_name || user.email}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {selectedChat.full_name?.[0] || selectedChat.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{selectedChat.full_name || selectedChat.email}</h3>
                <p className="text-sm text-gray-500">{selectedChat.email}</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendTextMessage()}
                  className="flex-1"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Upload className="w-4 h-4" />
                </Button>
                <Button onClick={sendTextMessage} disabled={loading || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Select a chat to start messaging</h3>
              <p>Choose from existing chats or search for users to start a new conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
