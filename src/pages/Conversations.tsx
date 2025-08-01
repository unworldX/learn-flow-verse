import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageCircle, Users, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  otherUserId?: string;
  avatarUrl?: string;
}

const Conversations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Fetch direct message conversations
      const { data: directMessages, error: dmError } = await supabase
        .from('direct_messages')
        .select(`
          id, sender_id, receiver_id, encrypted_content, created_at,
          sender:users!sender_id(full_name, email),
          receiver:users!receiver_id(full_name, email)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (dmError) throw dmError;

      // Fetch group conversations
      const { data: groupMemberships, error: groupError } = await supabase
        .from('study_group_members')
        .select(`
          group_id,
          study_groups!inner(id, name, description)
        `)
        .eq('user_id', user.id);

      if (groupError) throw groupError;

      // Get latest group messages
      const groupIds = groupMemberships?.map(m => m.group_id) || [];
      let groupMessages: any[] = [];
      
      if (groupIds.length > 0) {
        const { data: latestGroupMessages, error: groupMsgError } = await supabase
          .from('group_messages')
          .select('group_id, encrypted_content, created_at')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false });

        if (groupMsgError) throw groupMsgError;
        groupMessages = latestGroupMessages || [];
      }

      // Process direct message conversations
      const dmConversations = new Map<string, Conversation>();
      
      directMessages?.forEach((message: any) => {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const otherUser = message.sender_id === user.id ? message.receiver : message.sender;
        
        if (!dmConversations.has(otherUserId)) {
          dmConversations.set(otherUserId, {
            id: otherUserId,
            type: 'direct',
            name: otherUser?.full_name || otherUser?.email?.split('@')[0] || 'Unknown User',
            lastMessage: message.encrypted_content,
            lastMessageTime: message.created_at,
            otherUserId: otherUserId,
            unreadCount: 0
          });
        }
      });

      // Process group conversations
      const groupConversations: Conversation[] = groupMemberships?.map(membership => {
        const group = membership.study_groups;
        const latestMessage = groupMessages.find(msg => msg.group_id === group.id);
        
        return {
          id: group.id,
          type: 'group',
          name: group.name,
          lastMessage: latestMessage?.encrypted_content || 'No messages yet',
          lastMessageTime: latestMessage?.created_at || new Date().toISOString(),
          unreadCount: 0
        };
      }) || [];

      // Combine and sort all conversations
      const allConversations = [
        ...Array.from(dmConversations.values()),
        ...groupConversations
      ].sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0).getTime();
        const timeB = new Date(b.lastMessageTime || 0).getTime();
        return timeB - timeA;
      });

      setConversations(allConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    if (!searchEmail.trim()) return;

    try {
      // Search for user by email
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('email', searchEmail.trim().toLowerCase())
        .limit(1);

      if (error) throw error;

      if (users && users.length > 0) {
        const foundUser = users[0];
        setShowNewChat(false);
        setSearchEmail('');
        // Navigate to chat with found user
        window.location.href = `/chat/${foundUser.id}`;
      } else {
        toast({
          title: "User not found",
          description: "No user found with that email address",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      toast({
        title: "Error",
        description: "Failed to search for user",
        variant: "destructive"
      });
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    
    const date = new Date(timeString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen liquid-bg flex items-center justify-center">
        <div className="glass-card p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-600 mt-2">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen liquid-bg relative">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-4xl">
        {/* WhatsApp-style Header */}
        <div className="glass-card p-3 md:p-4 mb-4 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-800">Chats</h1>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-3 mb-4 border border-white/20">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-white/30 rounded-full"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="glass-card border border-white/20 rounded-2xl overflow-hidden">
          <ScrollArea className="h-[calc(100vh-300px)] min-h-[400px]">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  to={conversation.type === 'direct' ? `/chat/${conversation.otherUserId}` : `/group-chat/${conversation.id}`}
                  className="block"
                >
                  <div className="p-4 hover:bg-white/30 transition-all border-b border-white/10 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        conversation.type === 'direct' 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                          : 'bg-gradient-to-br from-green-500 to-teal-500'
                      }`}>
                        {conversation.type === 'direct' ? (
                          <span className="text-white text-sm font-medium">
                            {conversation.name[0]?.toUpperCase()}
                          </span>
                        ) : (
                          <Users className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate text-slate-800">
                            {conversation.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatTime(conversation.lastMessageTime)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs truncate text-slate-500 max-w-[200px]">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                          {conversation.unreadCount && conversation.unreadCount > 0 && (
                            <div className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-600 mb-2">No conversations yet</p>
                <p className="text-sm text-slate-500 mb-4">Start a new chat or join a study group</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Floating Action Button for New Chat */}
      <div className="fixed bottom-6 right-6 z-50">
        <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
          <DialogTrigger asChild>
            <Button 
              size="lg"
              className="w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/30 max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">New Chat</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNewChat()}
                  className="pl-12 py-3 bg-slate-50 border-slate-200 rounded-xl text-base"
                />
              </div>
              <Button 
                onClick={handleNewChat} 
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl text-base font-medium"
                disabled={!searchEmail.trim()}
              >
                Start Conversation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Conversations;