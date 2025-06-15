
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
  User, Search, MessageCircle, Image, Video, FileText, Lock 
} from 'lucide-react';
import { encryptText, decryptText } from '@/lib/encryption';

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
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          study_group_members!inner(role),
          member_count:study_group_members(count)
        `)
        .eq('study_group_members.user_id', user.id);

      if (error) throw error;

      const groupsWithRole = data?.map(group => ({
        ...group,
        user_role: group.study_group_members[0]?.role,
        member_count: group.member_count?.[0]?.count || 0
      })) || [];

      setGroups(groupsWithRole);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedGroup) return;

    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender:users!group_messages_sender_id_fkey(email, full_name)
        `)
        .eq('group_id', selectedGroup.id)
        .is('deleted_at', null)
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

  const fetchMembers = async () => {
    if (!selectedGroup) return;

    try {
      const { data, error } = await supabase
        .from('study_group_members')
        .select(`
          *,
          user:users!study_group_members_user_id_fkey(email, full_name)
        `)
        .eq('group_id', selectedGroup.id)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
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
    
    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
        }`}>
          {!isOwn && (
            <p className="text-xs font-medium mb-1 opacity-75">
              {message.sender?.full_name || message.sender?.email}
            </p>
          )}
          
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
      {/* Groups List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Study Groups</h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your study group"
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
                    />
                  </div>
                  <Button onClick={createGroup} disabled={loading || !newGroup.name.trim()}>
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
              className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                selectedGroup?.id === group.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{group.name}</h3>
                  {group.is_private && <Lock className="w-4 h-4 text-gray-400" />}
                </div>
                <Badge variant="outline" className="text-xs">
                  {getRoleIcon(group.user_role || 'member')}
                  <span className="ml-1">{group.user_role}</span>
                </Badge>
              </div>
              {group.description && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{group.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{group.member_count} members</span>
                <span>{new Date(group.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <>
            {/* Group Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedGroup.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    {selectedGroup.name}
                    {selectedGroup.is_private && <Lock className="w-4 h-4 text-gray-400" />}
                  </h3>
                  <p className="text-sm text-gray-500">{members.length} members</p>
                </div>
              </div>
              <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Members
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Group Members</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-96">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {member.user?.full_name?.[0] || member.user?.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.user?.full_name || member.user?.email}
                            </p>
                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getRoleIcon(member.role)}
                          <span className="ml-1">{member.role}</span>
                        </Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
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
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a study group</h3>
              <p>Choose a group to view messages and participate in discussions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroups;
