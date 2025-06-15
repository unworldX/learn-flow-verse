import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Send, Upload, Users, Settings, Crown, Shield, 
  User, Search, MessageCircle, Image, Video, FileText, Lock, MoreVertical 
} from 'lucide-react';
import { encryptText, decryptText } from '@/lib/encryption';
import { useIsMobile } from '@/hooks/use-mobile';

interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  is_private: boolean;
  max_members: number;
  member_count?: number;
  user_role?: string;
}

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  encrypted_content?: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
  sender?: {
    email: string;
    full_name?: string;
  };
  decrypted_content?: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
}

const StudyGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    is_private: false,
    max_members: 50
  });

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup && user) {
      fetchMessages();
      fetchMembers();
    }
  }, [selectedGroup, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !selectedGroup) return;

    // Subscribe to new group messages
    const channel = supabase
      .channel(`group-${selectedGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${selectedGroup.id}`
        },
        (payload) => {
          const newMessage = payload.new as GroupMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedGroup]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroups = async () => {
    if (!user) return;

    try {
      // First get groups where user is a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('study_group_members')
        .select(`
          role,
          study_groups!inner(
            id,
            name,
            description,
            created_by,
            created_at,
            is_private,
            max_members
          )
        `)
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      // Get member counts for each group
      const groupIds = membershipData?.map(m => m.study_groups.id) || [];
      const { data: memberCounts, error: countError } = await supabase
        .from('study_group_members')
        .select('group_id')
        .in('group_id', groupIds);

      if (countError) throw countError;

      const countMap = new Map<string, number>();
      memberCounts?.forEach(member => {
        countMap.set(member.group_id, (countMap.get(member.group_id) || 0) + 1);
      });

      const groupsWithRole = membershipData?.map(membership => ({
        ...membership.study_groups,
        user_role: membership.role,
        member_count: countMap.get(membership.study_groups.id) || 0
      })) || [];

      setGroups(groupsWithRole);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedGroup) return;

    try {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('group_messages')
        .select(`
          id,
          group_id,
          sender_id,
          encrypted_content,
          message_type,
          file_url,
          file_name,
          file_size,
          created_at,
          deleted_at
        `)
        .eq('group_id', selectedGroup.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Get sender information
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: sendersData, error: sendersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', senderIds);

      if (sendersError) throw sendersError;

      const sendersMap = new Map(sendersData?.map(s => [s.id, s]) || []);

      // Decrypt text messages and fix types
      const decryptedMessages = await Promise.all(
        (messagesData || []).map(async (message) => {
          const sender = sendersMap.get(message.sender_id);
          const typedMessage: GroupMessage = {
            ...message,
            message_type: message.message_type as 'text' | 'image' | 'video' | 'file',
            sender
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

  const fetchMembers = async () => {
    if (!selectedGroup) return;

    try {
      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from('study_group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq('group_id', selectedGroup.id)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      // Get user information
      const userIds = membersData?.map(m => m.user_id) || [];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      const membersWithUsers: GroupMember[] = membersData?.map(member => ({
        ...member,
        role: member.role as 'admin' | 'moderator' | 'member',
        user: usersMap.get(member.user_id)
      })) || [];

      setMembers(membersWithUsers);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const createGroup = async () => {
    if (!user || !newGroup.name.trim()) return;

    setLoading(true);
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          created_by: user.id,
          is_private: newGroup.is_private,
          max_members: newGroup.max_members
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      setNewGroup({ name: '', description: '', is_private: false, max_members: 50 });
      setShowCreateDialog(false);
      await fetchGroups();
      
      toast({
        title: "Success",
        description: "Study group created successfully"
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create study group",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTextMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !user) return;

    setLoading(true);
    try {
      const encryptedContent = await encryptText(newMessage);
      
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: selectedGroup.id,
          sender_id: user.id,
          encrypted_content: encryptedContent,
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages();
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
    if (!selectedGroup || !user) return;

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
        .from('group_messages')
        .insert({
          group_id: selectedGroup.id,
          sender_id: user.id,
          message_type: messageType,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size
        });

      if (error) throw error;

      await fetchMessages();
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderMessage = (message: GroupMessage) => {
    const isOwn = message.sender_id === user?.id;
    const messageTime = new Date(message.created_at);
    const isToday = messageTime.toDateString() === new Date().toDateString();
    const timeDisplay = isToday 
      ? messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : messageTime.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
        {!isOwn && (
          <Avatar className="w-8 h-8 mr-3 mt-1">
            <AvatarFallback className="text-xs bg-gradient-to-br from-green-400 to-blue-500 text-white">
              {message.sender?.full_name?.[0] || message.sender?.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-12' : 'mr-12'}`}>
          {!isOwn && (
            <p className="text-xs font-medium text-gray-600 mb-1 ml-2">
              {message.sender?.full_name || message.sender?.email}
            </p>
          )}
          <div className={`px-4 py-3 rounded-2xl shadow-sm ${
            isOwn 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white ml-auto' 
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
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {!selectedGroup ? (
          <>
            {/* Mobile Header with Search */}
            <div className="bg-white border-b border-gray-200 p-4">
              <h1 className="text-2xl font-bold mb-4 text-gray-800">Study Groups</h1>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Groups List */}
            <ScrollArea className="flex-1">
              {(searchQuery ? filteredGroups : groups).map((group) => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className="p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-all duration-200 bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {group.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{group.name}</h3>
                          {group.is_private && <Lock className="w-4 h-4 text-gray-400" />}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getRoleIcon(group.user_role || 'member')}
                          <span className="ml-1 capitalize">{group.user_role}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{group.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{group.member_count} members</span>
                    </div>
                    <span>{new Date(group.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </ScrollArea>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 shadow-lg" size="icon">
                    <Plus className="w-6 h-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Study Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Group Name</Label>
                      <Input
                        id="name"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter group name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={newGroup.description}
                        onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your study group"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="private"
                        checked={newGroup.is_private}
                        onCheckedChange={(checked) => setNewGroup(prev => ({ ...prev, is_private: checked }))}
                      />
                      <Label htmlFor="private">Private Group</Label>
                    </div>
                    <div>
                      <Label htmlFor="max_members">Max Members</Label>
                      <Input
                        id="max_members"
                        type="number"
                        min="2"
                        max="100"
                        value={newGroup.max_members}
                        onChange={(e) => setNewGroup(prev => ({ ...prev, max_members: parseInt(e.target.value) }))}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={createGroup} disabled={loading || !newGroup.name.trim()} className="w-full">
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        ) : (
          /* Group Chat View for Mobile */
          <>
            {/* Group Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedGroup(null)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedGroup.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {selectedGroup.name}
                    {selectedGroup.is_private && <Lock className="w-4 h-4 text-gray-400" />}
                  </h3>
                  <p className="text-sm text-gray-500">{members.length} members</p>
                </div>
              </div>
              <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Group Members ({members.length})</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white">
                                {member.user?.full_name?.[0] || member.user?.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {member.user?.full_name || member.user?.email}
                              </p>
                              <p className="text-xs text-gray-500">{member.user?.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getRoleIcon(member.role)}
                            <span className="ml-1 capitalize">{member.role}</span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
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
                    className="pr-12 py-3 rounded-full border-gray-300 focus:border-green-500 transition-colors"
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
                  className="rounded-full px-6 bg-green-500 hover:bg-green-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop Layout (existing code)
  return (
    <div className="h-full flex bg-gray-50">
      {/* Groups List */}
      <div className="w-1/3 bg-white border-r border-gray-200">
        <div className="p-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Study Groups</h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Study Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter group name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your study group"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="private"
                      checked={newGroup.is_private}
                      onCheckedChange={(checked) => setNewGroup(prev => ({ ...prev, is_private: checked }))}
                    />
                    <Label htmlFor="private">Private Group</Label>
                  </div>
                  <div>
                    <Label htmlFor="max_members">Max Members</Label>
                    <Input
                      id="max_members"
                      type="number"
                      min="2"
                      max="100"
                      value={newGroup.max_members}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, max_members: parseInt(e.target.value) }))}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={createGroup} disabled={loading || !newGroup.name.trim()} className="w-full">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-all duration-200 ${
                selectedGroup?.id === group.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {group.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      {group.is_private && <Lock className="w-4 h-4 text-gray-400" />}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getRoleIcon(group.user_role || 'member')}
                      <span className="ml-1 capitalize">{group.user_role}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              {group.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{group.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{group.member_count} members</span>
                </div>
                <span>{new Date(group.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedGroup ? (
          <>
            {/* Group Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedGroup.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {selectedGroup.name}
                    {selectedGroup.is_private && <Lock className="w-4 h-4 text-gray-400" />}
                  </h3>
                  <p className="text-sm text-gray-500">{members.length} members active</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Group Members ({members.length})</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-96">
                      <div className="space-y-3">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white">
                                  {member.user?.full_name?.[0] || member.user?.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {member.user?.full_name || member.user?.email}
                                </p>
                                <p className="text-xs text-gray-500">{member.user?.email}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getRoleIcon(member.role)}
                              <span className="ml-1 capitalize">{member.role}</span>
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
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
                    className="pr-12 py-3 rounded-full border-gray-300 focus:border-green-500 transition-colors"
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
                  className="rounded-full px-6 bg-green-500 hover:bg-green-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a study group</h3>
              <p className="text-gray-500 leading-relaxed">
                Choose a group to view messages and participate in collaborative discussions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroups;
