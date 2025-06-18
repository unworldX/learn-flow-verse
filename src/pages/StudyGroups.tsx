
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, Globe } from "lucide-react";
import { useRealStudyGroups } from "@/hooks/useRealStudyGroups";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";

const StudyGroups = () => {
  const { studyGroups, myGroups, isLoading, joinGroup, leaveGroup } = useRealStudyGroups();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Study Groups</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const GroupCard = ({ group }: { group: any }) => (
    <Card key={group.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{group.name}</CardTitle>
          <div className="flex items-center space-x-1">
            {group.is_private ? (
              <Lock className="h-4 w-4 text-gray-500" />
            ) : (
              <Globe className="h-4 w-4 text-green-500" />
            )}
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {group.member_count}/{group.max_members}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {group.description}
        </p>
        <div className="text-xs text-gray-500 mb-4">
          <p>Created: {new Date(group.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex justify-between items-center">
          {group.is_member ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => leaveGroup(group.id)}
              className="w-full"
            >
              Leave Group
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={() => joinGroup(group.id)}
              disabled={group.member_count >= group.max_members}
              className="w-full"
            >
              {group.member_count >= group.max_members ? 'Full' : 'Join Group'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Study Groups</h1>
        <CreateGroupDialog />
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Groups</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups ({myGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyGroups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-gray-500">No study groups found</p>
                <p className="text-sm text-gray-400">Be the first to create one!</p>
              </div>
            ) : (
              studyGroups.map((group) => <GroupCard key={group.id} group={group} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-groups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-gray-500">You haven't joined any groups yet</p>
                <p className="text-sm text-gray-400">Join a group to start collaborating!</p>
              </div>
            ) : (
              myGroups.map((group) => <GroupCard key={group.id} group={group} />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudyGroups;
