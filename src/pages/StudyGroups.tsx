
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Users, Plus, Calendar, MessageSquare, Lock, Globe } from 'lucide-react';
import { useRealStudyGroups } from '@/hooks/useRealStudyGroups';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const StudyGroups = () => {
  const { user } = useAuth();
  const { studyGroups, myGroups, isLoading, joinGroup, leaveGroup, createGroup } = useRealStudyGroups();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    is_private: false,
    max_members: 50
  });

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;
    
    const result = await createGroup(newGroup);
    if (result) {
      setShowCreateDialog(false);
      setNewGroup({
        name: '',
        description: '',
        is_private: false,
        max_members: 50
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Study Groups</h2>
          <p className="text-gray-600 mb-4">Please sign in to join study groups</p>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
          <p className="text-gray-600">Connect and collaborate with other students</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
              <DialogDescription>
                Create a new study group to collaborate with other students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Describe your study group"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={newGroup.is_private}
                  onCheckedChange={(checked) => setNewGroup({ ...newGroup, is_private: checked })}
                />
                <Label htmlFor="private">Private Group</Label>
              </div>
              <div>
                <Label htmlFor="maxMembers">Max Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={newGroup.max_members}
                  onChange={(e) => setNewGroup({ ...newGroup, max_members: parseInt(e.target.value) || 50 })}
                  min="2"
                  max="500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={!newGroup.name.trim()}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Groups */}
      {myGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              My Study Groups
            </CardTitle>
            <CardDescription>Groups you're a member of</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGroups.map((group) => (
                <Card key={group.id} className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.is_private ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {group.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center mb-3">
                      <Badge variant="secondary">
                        {group.member_count || 0} / {group.max_members} members
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(group.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link to="/chats" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Chat
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => leaveGroup(group.id)}
                      >
                        Leave
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Discover Groups
          </CardTitle>
          <CardDescription>Find and join study groups</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : studyGroups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No study groups yet</h3>
              <p className="text-gray-600 mb-4">Be the first to create a study group!</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Create First Group
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyGroups.filter(group => !group.is_member).map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.is_private ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {group.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center mb-3">
                      <Badge variant="outline">
                        {group.member_count || 0} / {group.max_members} members
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(group.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => joinGroup(group.id)}
                      disabled={(group.member_count || 0) >= group.max_members}
                    >
                      {(group.member_count || 0) >= group.max_members ? 'Full' : 'Join Group'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyGroups;
