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
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="md:hidden rounded-full">
              <Link to="/conversations">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-800 text-lg">{groupInfo?.name}</h1>
              {groupInfo && <p className="text-xs text-slate-500">{groupInfo.member_count} members</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col relative" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f8fafc' fill-opacity='0.3'%3E%3Cpath d='m0 40l40-40h-40v40z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: '#f8fafc'
      }}>
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center py-16">
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
            <div className="space-y-2">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const prev = messages[index - 1];
                const showTime = !prev || (new Date(message.created_at).getTime() - new Date(prev.created_at).getTime() > 300000);
                return (
                  <div key={message.id}>
                    {showTime && (
                      <div className="text-center py-2">
                        <span className="text-xs text-slate-500 bg-white/80 px-3 py-1 rounded-full">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 relative ${
                        isOwn
                          ? 'bg-blue-500 text-white rounded-tl-2xl rounded-tr-lg rounded-bl-2xl shadow-md'
                          : 'bg-white text-slate-800 rounded-tr-2xl rounded-tl-lg rounded-br-2xl shadow-md border border-gray-100'
                      }`}>
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1 text-slate-600">
                            {message.sender?.full_name || message.sender?.email?.split('@')[0] || 'Member'}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{message.encrypted_content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwn ? 'text-white/70' : 'text-slate-400'
                        }`}>
                          <span className="text-xs">
                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                          {isOwn && (
                            <div className="text-blue-200 text-xs ml-1">✓✓</div>
                          )}
                        </div>
                        <div className={`absolute bottom-0 w-3 h-3 ${
                          isOwn
                            ? 'right-0 bg-blue-500 rounded-bl-full transform translate-x-1'
                            : 'left-0 bg-white rounded-br-full transform -translate-x-1 border-r border-b border-gray-100'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message"
              className="flex-1 bg-gray-100 border-0 rounded-full px-5 py-3 text-sm placeholder:text-slate-500"
            />
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 p-0 shrink-0 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;