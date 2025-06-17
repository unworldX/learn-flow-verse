
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, User } from "lucide-react";
import { useDirectMessages } from "@/hooks/useDirectMessages";

const DirectMessages = () => {
  const { messages, chatUsers, isLoading, fetchMessages, sendMessage } = useDirectMessages();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Direct Messages</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {chatUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              ) : (
                chatUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                      selectedUser === user.id ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                    }`}
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 rounded-full p-2">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.full_name || user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedUser 
                ? chatUsers.find(u => u.id === selectedUser)?.full_name || 'Chat'
                : 'Select a conversation'
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedUser ? (
              <div className="h-[500px] flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === selectedUser ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === selectedUser
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            <p className="text-sm">{message.encrypted_content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                <Separator />
                
                <div className="p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-gray-500">
                Select a conversation to start messaging
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DirectMessages;
