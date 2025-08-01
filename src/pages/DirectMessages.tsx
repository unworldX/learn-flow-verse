
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
    <div className="min-h-screen liquid-bg relative">
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-7xl">
        {/* WhatsApp-style Title Bar */}
        <div className="glass-card p-3 md:p-4 mb-4 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-800">Messages</h1>
              <p className="text-xs text-slate-500">Private conversations</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-160px)] min-h-[500px]">
          {/* WhatsApp-style Chat Users List */}
          <div className="glass-card flex flex-col border border-white/20 lg:max-h-full rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-white/20 bg-white/5">
              <h3 className="font-medium text-slate-700 text-sm">Chats</h3>
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
                      className={`p-3 cursor-pointer transition-all border-b border-white/10 ${
                        selectedUser === chatUser.id 
                          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                          : 'hover:bg-white/30'
                      }`}
                      onClick={() => handleUserSelect(chatUser.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-slate-800">
                            {chatUser.full_name || chatUser.email.split('@')[0]}
                          </p>
                          <p className="text-xs truncate text-slate-500">
                            Last seen recently
                          </p>
                        </div>
                        <div className="text-xs text-slate-400">
                          12:30 PM
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* WhatsApp-style Messages Area */}
          <div className="lg:col-span-2 glass-card flex flex-col border border-white/20 rounded-2xl overflow-hidden">
            {selectedUser && (
              <div className="p-3 border-b border-white/20 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 text-sm">
                      {chatUsers.find(u => u.id === selectedUser)?.full_name || chatUsers.find(u => u.id === selectedUser)?.email?.split('@')[0] || 'Chat'}
                    </h3>
                    <p className="text-xs text-slate-500">Online</p>
                  </div>
                </div>
              </div>
            )}
            
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
                            className={`max-w-xs lg:max-w-md px-3 py-2 ${
                              message.sender_id === user?.id
                                ? 'bg-blue-500 text-white rounded-bl-2xl rounded-tl-2xl rounded-tr-lg'
                                : 'bg-white border border-gray-200 text-slate-800 rounded-br-2xl rounded-tr-2xl rounded-tl-lg shadow-sm'
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
                
                <div className="p-3 border-t border-white/20 bg-white/5">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-white border-gray-200 rounded-full px-4 py-2 text-sm"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 p-0"
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
      
      {/* Floating Action Button for New Message */}
      <div className="fixed bottom-6 right-6 z-50">
        <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
          <DialogTrigger asChild>
            <Button 
              size="lg"
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110"
            >
              <Plus className="w-6 h-6" />
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
  );
};

export default DirectMessages;
