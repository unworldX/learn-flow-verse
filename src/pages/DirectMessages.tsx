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
import { Badge } from '@/components/ui/badge';
import { Upload, Send, Image, Video, FileText, Search, MoreVertical, Phone, VideoIcon } from 'lucide-react';
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
  decrypted_content?: string;
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
      // Fetch messages with sender and receiver information
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          encrypted_content,
          message_type,
          file_url,
          file_name,
          file_size,
          created_at,
          is_read,
          deleted_by_sender,
          deleted_by_receiver
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs to fetch user details
      const userIds = new Set<string>();
      messagesData?.forEach(message => {
        userIds.add(message.sender_id);
        userIds.add(message.receiver_id);
      });

      // Fetch user details
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', Array.from(userIds));

      if (usersError) throw usersError;

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Group messages by chat partner
      const chatMap = new Map<string, Chat>();
      
      for (const message of messagesData || []) {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const partner = usersMap.get(partnerId);
        
        if (partner && !chatMap.has(partnerId)) {
          chatMap.set(partnerId, {
            user: partner,
            lastMessage: {
              ...message,
              message_type: message.message_type as 'text' | 'image' | 'video' | 'file'
            },
            unreadCount: 0
          });
        }

        // Count unread messages
        if (message.receiver_id === user.id && !message.is_read) {
          const chat = chatMap.get(partnerId);
          if (chat) {
            chat.unreadCount++;
          }
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

      // Decrypt text messages and fix types
      const decryptedMessages = await Promise.all(
        (data || []).map(async (message) => {
          const typedMessage: DirectMessage = {
            ...message,
            message_type: message.message_type as 'text' | 'image' | 'video' | 'file'
          };

          if (message.message_type === 'text' && message.encrypted_content) {
            return {
              ...typedMessage,
              decrypted_content: await decryptText(message.encrypted_content)
            };
          }
          return typedMessage;
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

  const renderMessage = (message: DirectMessage) => {
    const isOwn = message.sender_id === user?.id;
    const messageTime = new Date(message.created_at);
    const isToday = messageTime.toDateString() === new Date().toDateString();
    const timeDisplay = isToday 
      ? messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : messageTime.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}>
        {!isOwn && (
          <Avatar className="w-8 h-8 mr-2 mt-1">
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
              {selectedChat?.full_name?.[0] || selectedChat?.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-12' : 'mr-12'}`}>
          <div className={`px-4 py-2 rounded-2xl shadow-sm ${
            isOwn 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto' 
              : 'bg-white border border-gray-200 text-gray-900'
          } ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`}>
            {message.message_type === 'text' ? (
              <p className="text-sm leading-relaxed">{message.decrypted_content || message.encrypted_content}</p>
            ) : message.message_type === 'image' ? (
              <div className="space-y-2">
                <img src={message.file_url} alt={message.file_name} className="max-w-full rounded-lg" />
                <p className="text-xs opacity-75">{message.file_name}</p>
              </div>
            ) : message.message_type === 'video' ? (
              <div className="space-y-2">
                <video controls className="max-w-full rounded-lg">
                  <source src={message.file_url} />
                </video>
                <p className="text-xs opacity-75">{message.file_name}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <a href={message.file_url} download={message.file_name} className="underline text-sm">
                  {message.file_name}
                </a>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500">{timeDisplay}</span>
            {isOwn && message.is_read && (
              <span className="text-xs text-blue-500">✓✓</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Chat List */}
      <div className="w-1/3 bg-white border-r border-gray-200">
        <div className="p-4 bg-white border-b border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {/* Existing Chats */}
          {chats.map((chat) => (
            <div
              key={chat.user.id}
              onClick={() => setSelectedChat(chat.user)}
              className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-all duration-200 ${
                selectedChat?.id === chat.user.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-medium">
                      {chat.user.full_name?.[0] || chat.user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 truncate">
                      {chat.user.full_name || chat.user.email}
                    </p>
                    {chat.unreadCount > 0 && (
                      <Badge className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage?.message_type === 'text' ? '💬 Text message' : 
                     chat.lastMessage?.message_type === 'image' ? '📷 Photo' :
                     chat.lastMessage?.message_type === 'video' ? '🎥 Video' : '📎 File'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* New Chat Options */}
          {searchQuery && (
            <>
              <Separator className="my-2" />
              <div className="p-2">
                <p className="text-sm font-medium text-gray-500 mb-2 px-2">Start new chat</p>
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => startNewChat(user)}
                    className="p-3 cursor-pointer hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="text-sm bg-gradient-to-br from-green-400 to-blue-500 text-white">
                        {user.full_name?.[0] || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.full_name || user.email}</p>
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
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-medium">
                    {selectedChat.full_name?.[0] || selectedChat.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedChat.full_name || selectedChat.email}</h3>
                  <p className="text-sm text-green-500">● Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <VideoIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-white">
              <div className="space-y-1">
                {messages.map(renderMessage)}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendTextMessage()}
                    className="pr-12 py-3 rounded-full border-gray-300 focus:border-blue-500 transition-colors"
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
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={sendTextMessage} 
                  disabled={loading || !newMessage.trim()}
                  className="rounded-full px-6 bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a conversation</h3>
              <p className="text-gray-500 leading-relaxed">
                Choose from your existing conversations or search for someone new to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
