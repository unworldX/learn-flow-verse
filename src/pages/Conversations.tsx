import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Users, Plus, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";

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

  const directConversations = filteredConversations.filter(conv => conv.type === 'direct');
  const groupConversations = filteredConversations.filter(conv => conv.type === 'group');
  const unreadConversations = filteredConversations.filter(conv => conv.unreadCount && conv.unreadCount > 0);

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

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => (
    <Link
      to={conversation.type === 'direct' ? `/chat/${conversation.otherUserId}` : `/group-chat/${conversation.id}`}
      className="block"
    >
      <div className="p-4 hover:bg-white/40 transition-all cursor-pointer border-b border-white/5">
        <div className="flex items-center space-x-3">
          {/* Profile Picture */}
          <div className="relative">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
              conversation.type === 'direct' 
                ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                : 'bg-gradient-to-br from-green-500 to-teal-500'
            }`}>
              {conversation.type === 'direct' ? (
                <span className="text-white text-lg font-semibold">
                  {conversation.name[0]?.toUpperCase()}
                </span>
              ) : (
                <Users className="h-7 w-7 text-white" />
              )}
            </div>
            {/* Online indicator for direct messages */}
            {conversation.type === 'direct' && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-base font-semibold truncate text-slate-800 max-w-[180px]">
                {conversation.name}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 font-medium">
                  {formatTime(conversation.lastMessageTime)}
                </p>
                {conversation.unreadCount && conversation.unreadCount > 0 && (
                  <Badge className="bg-green-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm truncate text-slate-600 max-w-[200px] leading-tight">
                {conversation.lastMessage || (conversation.type === 'group' ? 'Tap to join the conversation' : 'Start a conversation')}
              </p>
              {/* Read receipts for sent messages */}
              <div className="text-blue-500 text-xs">
                ✓✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

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

        {/* Tabs + Search (compact header) */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="glass-card p-2 mb-4 border border-white/20 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <TabsList className="bg-transparent p-1 rounded-xl h-9 w-full md:w-auto">
                <TabsTrigger 
                  value="all" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm px-3"
                >
                  Chats
                  {conversations.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 text-[10px] md:text-xs">
                      {conversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="groups" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm px-3"
                >
                  Groups
                  {groupConversations.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 text-[10px] md:text-xs">
                      {groupConversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="unread" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm px-3"
                >
                  Unread
                  {unreadConversations.length > 0 && (
                    <Badge className="ml-2 h-5 text-[10px] md:text-xs bg-green-500">
                      {unreadConversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/90 border-0 rounded-full text-sm h-9 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* All Conversations */}
          <TabsContent value="all">
            <div className="glass-card border border-white/20 rounded-2xl overflow-hidden shadow-lg">
              <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No conversations yet</h3>
                    <p className="text-slate-500 mb-6">Start a new chat or join a study group</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Groups Only */}
          <TabsContent value="groups">
            <div className="glass-card border border-white/20 rounded-2xl overflow-hidden shadow-lg">
              <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
                {groupConversations.length > 0 ? (
                  groupConversations.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No group chats</h3>
                    <p className="text-slate-500 mb-6">Join or create a study group to start collaborating</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Unread Only */}
          <TabsContent value="unread">
            <div className="glass-card border border-white/20 rounded-2xl overflow-hidden shadow-lg">
              <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
                {unreadConversations.length > 0 ? (
                  unreadConversations.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">All caught up!</h3>
                    <p className="text-slate-500 mb-6">You have no unread messages</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Speed-dial FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110"
            >
              <Plus className="w-7 h-7 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1">
            <CreateGroupDialog>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Create Group</span>
              </DropdownMenuItem>
            </CreateGroupDialog>
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setShowNewChat(true)}
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>New Chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* New Chat Dialog */}
        <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
          <DialogContent className="glass-card border-white/30 max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Start a conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Enter email to find user"
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
                Start Chat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Conversations;