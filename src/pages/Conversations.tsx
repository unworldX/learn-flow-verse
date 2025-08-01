import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageCircle, Users, Plus } from "lucide-react";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useRealStudyGroups } from "@/hooks/useRealStudyGroups";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Conversations = () => {
  const { user } = useAuth();
  const { chatUsers } = useDirectMessages();
  const { myGroups } = useRealStudyGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');

  // Filter conversations based on search
  const filteredDirectMessages = chatUsers.filter(chatUser =>
    chatUser.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chatUser.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = myGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = () => {
    if (searchEmail.trim()) {
      setShowNewChat(false);
      setSearchEmail('');
    }
  };

  return (
    <div className="min-h-screen liquid-bg relative">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-4xl">
        {/* WhatsApp-style Header */}
        <div className="glass-card p-3 md:p-4 mb-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-slate-800">Chats</h1>
                <p className="text-xs text-slate-500">{filteredDirectMessages.length + filteredGroups.length} conversations</p>
              </div>
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
            {/* Direct Messages */}
            {filteredDirectMessages.length > 0 && (
              <div>
                {filteredDirectMessages.map((chatUser) => (
                  <Link
                    key={chatUser.id}
                    to={`/chat/${chatUser.id}`}
                    className="block"
                  >
                    <div className="p-4 hover:bg-white/30 transition-all border-b border-white/10 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate text-slate-800">
                              {chatUser.full_name || chatUser.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-slate-400">12:30 PM</p>
                          </div>
                          <p className="text-xs truncate text-slate-500 mt-1">
                            Tap to start chatting
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Group Chats */}
            {filteredGroups.length > 0 && (
              <div>
                {filteredGroups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/group-chat/${group.id}`}
                    className="block"
                  >
                    <div className="p-4 hover:bg-white/30 transition-all border-b border-white/10 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate text-slate-800">
                              {group.name}
                            </p>
                            <p className="text-xs text-slate-400">Yesterday</p>
                          </div>
                          <p className="text-xs truncate text-slate-500 mt-1">
                            {group.member_count} members
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredDirectMessages.length === 0 && filteredGroups.length === 0 && (
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
          <DialogContent className="glass-card border-white/30">
            <DialogHeader>
              <DialogTitle>Start New Chat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Enter user email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10 bg-white/80 border-white/30"
                />
              </div>
              <Button onClick={handleNewChat} className="w-full">
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