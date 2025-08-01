
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, User, Plus, Search, MessageCircle } from "lucide-react";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

const DirectMessages = () => {
  const { user } = useAuth();
  const { messages, chatUsers, isLoading, fetchMessages, sendMessage } = useDirectMessages();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    fetchMessages(userId);
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;
    
    await sendMessage(selectedUser, newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    if (searchEmail.trim()) {
      // In a real app, you'd search for users by email
      setShowNewChat(false);
      setSearchEmail('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen liquid-bg flex items-center justify-center">
        <div className="glass-card p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-600 mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen liquid-bg">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-7xl">
        {/* Enhanced Title Bar */}
        <div className="glass-card p-4 md:p-6 mb-6 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold gradient-text">Direct Messages</h1>
                <p className="text-sm text-slate-600 mt-1">Private conversations with other students</p>
              </div>
            </div>
            
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/30">
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)] min-h-[500px]">
          {/* Enhanced Chat Users List */}
          <div className="glass-card flex flex-col border border-white/20 lg:max-h-full">
            <div className="p-4 border-b border-white/20 bg-white/5">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversations
              </h3>
            </div>
            <ScrollArea className="flex-1">
              {chatUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-slate-600 mb-2">No conversations yet</p>
                  <p className="text-sm text-slate-500">Start a new chat to begin</p>
                </div>
              ) : (
                <div className="p-2">
                  {chatUsers.map((chatUser) => (
                    <div
                      key={chatUser.id}
                      className={`p-3 m-1 cursor-pointer rounded-xl transition-all ${
                        selectedUser === chatUser.id 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                          : 'hover:bg-white/50'
                      }`}
                      onClick={() => handleUserSelect(chatUser.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`rounded-full p-2 ${
                          selectedUser === chatUser.id 
                            ? 'bg-white/20' 
                            : 'bg-gradient-to-br from-blue-500 to-purple-500'
                        }`}>
                          <User className={`h-4 w-4 ${
                            selectedUser === chatUser.id ? 'text-white' : 'text-white'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {chatUser.full_name || chatUser.email.split('@')[0]}
                          </p>
                          <p className={`text-xs truncate ${
                            selectedUser === chatUser.id ? 'text-white/70' : 'text-slate-500'
                          }`}>
                            {chatUser.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Enhanced Messages Area */}
          <div className="lg:col-span-2 glass-card flex flex-col border border-white/20">
            <div className="p-4 border-b border-white/20 bg-white/5">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                {selectedUser && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span>
                  {selectedUser 
                    ? chatUsers.find(u => u.id === selectedUser)?.full_name || chatUsers.find(u => u.id === selectedUser)?.email?.split('@')[0] || 'Chat'
                    : 'Select a conversation'
                  }
                </span>
              </h3>
            </div>
            
            {selectedUser ? (
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Send className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-slate-600 mb-2">No messages yet</p>
                      <p className="text-sm text-slate-500">Start a conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender_id === user?.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                : 'glass border border-white/30'
                            }`}
                          >
                            <p className="text-sm">{message.encrypted_content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-white/70' : 'text-slate-500'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                <div className="p-4 border-t border-white/20">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-white/80 border-white/30"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-slate-600 mb-2">Select a conversation</p>
                  <p className="text-sm text-slate-500">Choose someone to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
