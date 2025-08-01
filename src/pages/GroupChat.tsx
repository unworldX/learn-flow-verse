import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, ArrowLeft, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  encrypted_content: string;
  created_at: string;
  sender?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

const GroupChat = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (groupId) {
      fetchGroupInfo();
      fetchMessages();
    }
  }, [groupId]);

  const fetchGroupInfo = async () => {
    if (!groupId) return;

    try {
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      const { data: members, error: membersError } = await supabase
        .from('study_group_members')
        .select('id')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      setGroupInfo({
        ...group,
        member_count: members?.length || 0
      });
    } catch (error) {
      console.error('Error fetching group info:', error);
      toast({
        title: "Error",
        description: "Failed to load group information",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async () => {
    if (!groupId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender:users!sender_id (full_name, email)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedMessages = data?.map(msg => ({
        ...msg,
        sender: msg.sender && typeof msg.sender === 'object' && !Array.isArray(msg.sender) ? msg.sender : null
      })) || [];
      
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !groupId) return;

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          encrypted_content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen liquid-bg flex items-center justify-center">
        <div className="glass-card p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-600 mt-2">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen liquid-bg flex flex-col">
      {/* Header */}
      <div className="glass-card p-4 m-3 md:m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="md:hidden">
              <Link to="/conversations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{groupInfo?.name}</h1>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 mx-3 md:mx-4 mb-3 md:mb-4">
        <div className="glass-card h-full flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{groupInfo?.name}</h3>
                  <p className="text-slate-500 mb-4">This is the beginning of your group conversation</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-sm mx-auto">
                    <p className="text-sm text-blue-800">📚 Share study materials, ask questions, and collaborate with your group members!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender_id !== user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {message.sender?.full_name?.[0] || message.sender?.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        message.sender_id === user?.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'glass border border-white/30'
                      }`}
                    >
                      {message.sender_id !== user?.id && (
                        <p className="text-xs font-medium mb-1 text-slate-600">
                          {message.sender?.full_name || message.sender?.email?.split('@')[0]}
                        </p>
                      )}
                      <p className="text-sm">{message.encrypted_content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id ? 'text-white/70' : 'text-slate-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {message.sender_id === user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {user?.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          {/* Message Input */}
          <div className="p-4 border-t border-white/20 bg-white/5">
            <div className="flex gap-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message..."
                className="flex-1 bg-white border-gray-200 rounded-full px-5 py-3 text-sm placeholder:text-slate-500"
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 p-0 shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;