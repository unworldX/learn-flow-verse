
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, Globe, MessageCircle, Plus } from "lucide-react";
import { useRealStudyGroups } from "@/hooks/useRealStudyGroups";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { Link } from "react-router-dom";

const StudyGroups = () => {
  const { studyGroups, myGroups, isLoading, joinGroup, leaveGroup } = useRealStudyGroups();

  if (isLoading) {
    return (
      <div className="min-h-screen liquid-bg">
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-6">
          <div className="glass-card p-4 md:p-6 mb-6">
            <h1 className="text-xl md:text-2xl font-bold gradient-text">Study Groups</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const GroupCard = ({ group }: { group: any }) => (
    <div className="glass-card p-4 card-hover">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-base md:text-lg font-semibold line-clamp-2 flex-1 mr-2">
          {group.name}
        </h3>
        <div className="flex items-center space-x-1 shrink-0">
          {group.is_private ? (
            <Lock className="h-4 w-4 text-slate-500" />
          ) : (
            <Globe className="h-4 w-4 text-emerald-500" />
          )}
          <Badge variant="outline" className="text-xs border-white/30 bg-white/20">
            <Users className="h-3 w-3 mr-1" />
            {group.member_count}/{group.max_members}
          </Badge>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
        {group.description}
      </p>
      
      <div className="text-xs text-slate-500 mb-4">
        <p>Created: {new Date(group.created_at).toLocaleDateString()}</p>
      </div>
      
      <div className="flex gap-2">
        {group.is_member ? (
          <>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => leaveGroup(group.id)}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              Leave Group
            </Button>
            <Button 
              size="sm"
              asChild
              className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Link to={`/group-chat/${group.id}`}>
                <MessageCircle className="h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <Button 
            size="sm"
            onClick={() => joinGroup(group.id)}
            disabled={group.member_count >= group.max_members}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-400 disabled:to-slate-500"
          >
            {group.member_count >= group.max_members ? 'Full' : 'Join Group'}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen liquid-bg">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6">
        {/* Title Bar */}
        <div className="glass-card p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold gradient-text">Study Groups</h1>
              <p className="text-sm text-slate-600 mt-1">Connect and collaborate with fellow students</p>
            </div>
            <CreateGroupDialog />
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <div className="glass p-3 rounded-xl">
            <TabsList className="grid w-full grid-cols-2 bg-white/50">
              <TabsTrigger value="all" className="text-sm">All Groups</TabsTrigger>
              <TabsTrigger value="my-groups" className="text-sm">
                My Groups ({myGroups.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {studyGroups.length === 0 ? (
                <div className="col-span-full glass-card p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-lg text-slate-700 mb-2">No study groups found</p>
                  <p className="text-sm text-slate-500 mb-4">Be the first to create one!</p>
                  <CreateGroupDialog />
                </div>
              ) : (
                studyGroups.map((group) => <GroupCard key={group.id} group={group} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-groups">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {myGroups.length === 0 ? (
                <div className="col-span-full glass-card p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-lg text-slate-700 mb-2">You haven't joined any groups yet</p>
                  <p className="text-sm text-slate-500">Join a group to start collaborating!</p>
                </div>
              ) : (
                myGroups.map((group) => <GroupCard key={group.id} group={group} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudyGroups;
