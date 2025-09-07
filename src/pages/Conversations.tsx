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
          .select('id, sender_id, receiver_id, encrypted_content, created_at')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

      if (dmError) throw dmError;
      // Build user map for DM participants to avoid FK joins
      const otherUserIds = Array.from(
        new Set(
          (directMessages || [])
            .map((m: any) => (m.sender_id === user.id ? m.receiver_id : m.sender_id))
            .filter(Boolean)
        )
      );
      const userMap: Record<string, { full_name: string | null; email: string }> = {};
      if (otherUserIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', otherUserIds as string[]);
        if (usersError) throw usersError;
        usersData?.forEach((u: any) => {
          userMap[u.id] = { full_name: u.full_name, email: u.email };
        });
      }

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
        const otherUser = userMap[otherUserId];
        
        if (!dmConversations.has(otherUserId)) {
          dmConversations.set(otherUserId, {
            id: otherUserId,
            type: 'direct',
            name: (otherUser?.full_name || otherUser?.email?.split('@')[0] || 'Unknown User'),
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
      <div className="p-4 m-2 hover:bg-white/60 transition-all duration-200 cursor-pointer rounded-2xl border border-white/30 hover:border-white/50 hover:shadow-lg backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
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
            {/* Online Status */}
            {conversation.type === 'direct' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full shadow-sm"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold truncate text-slate-900 max-w-[180px]">
                {conversation.name}
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 font-medium">
                  {formatTime(conversation.lastMessageTime)}
                </p>
                {conversation.unreadCount && conversation.unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 shadow-sm">
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
      <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-600 mt-4">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="h-full flex flex-col">
        {/* Modern Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Conversations</h1>
                  <p className="text-slate-600">Connect with your study community</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white/90 border-2 border-white/50 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-8">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-white/60 backdrop-blur-sm p-1 rounded-2xl border border-white/50 shadow-sm inline-flex">
                  <TabsTrigger 
                    value="all" 
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-2 font-medium transition-all"
                  >
                    All Chats
                    {conversations.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 text-xs">
                        {conversations.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="groups" 
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-2 font-medium transition-all"
                  >
                    Groups
                    {groupConversations.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 text-xs">
                        {groupConversations.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="unread" 
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-2 font-medium transition-all"
                  >
                    Unread
                    {unreadConversations.length > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs">
                        {unreadConversations.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                {/* Content Area */}
                <div className="flex-1 overflow-hidden mt-8">
                  <div className="max-w-7xl mx-auto h-full">
                    
                    {/* All Conversations Tab */}
                    <TabsContent value="all" className="h-full m-0">
                      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl h-[calc(100vh-300px)] overflow-hidden">
                        <ScrollArea className="h-full">
                          {filteredConversations.length > 0 ? (
                            <div className="p-2">
                              {filteredConversations.map((conversation) => (
                                <ConversationItem key={conversation.id} conversation={conversation} />
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                  <MessageCircle className="w-12 h-12 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-3">No conversations yet</h3>
                                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Start a new chat or join a study group to connect with your learning community</p>
                              </div>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </TabsContent>

                    {/* Groups Tab */}
                    <TabsContent value="groups" className="h-full m-0">
                      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl h-[calc(100vh-300px)] overflow-hidden">
                        <ScrollArea className="h-full">
                          {groupConversations.length > 0 ? (
                            <div className="p-2">
                              {groupConversations.map((conversation) => (
                                <ConversationItem key={conversation.id} conversation={conversation} />
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                  <Users className="w-12 h-12 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-3">No group chats</h3>
                                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Join or create a study group to start collaborating with others</p>
                              </div>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </TabsContent>

                    {/* Unread Tab */}
                    <TabsContent value="unread" className="h-full m-0">
                      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl h-[calc(100vh-300px)] overflow-hidden">
                        <ScrollArea className="h-full">
                          {unreadConversations.length > 0 ? (
                            <div className="p-2">
                              {unreadConversations.map((conversation) => (
                                <ConversationItem key={conversation.id} conversation={conversation} />
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                  <MessageCircle className="w-12 h-12 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-3">All caught up!</h3>
                                <p className="text-slate-500 mb-6 max-w-sm mx-auto">You have no unread messages</p>
                              </div>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </TabsContent>
                  </div>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="lg"
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-0"
            >
              <Plus className="w-8 h-8 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-2 bg-white/95 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl">
            <CreateGroupDialog>
              <DropdownMenuItem className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-blue-50 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">Create Group</span>
              </DropdownMenuItem>
            </CreateGroupDialog>
            <DropdownMenuItem 
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-blue-50 transition-colors"
              onClick={() => setShowNewChat(true)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">New Chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Start New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </label>
              <Input
                id="email"
                placeholder="Enter user's email address"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowNewChat(false)}
                className="flex-1 border-2 border-slate-200 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleNewChat}
                disabled={!searchEmail.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 rounded-xl"
              >
                Start Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Conversations;