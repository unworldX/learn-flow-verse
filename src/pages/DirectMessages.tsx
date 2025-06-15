
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
}

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: Date;
}

const DirectMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with real data from your backend
  const [chats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: '',
      lastMessage: 'Hey! Did you finish the chemistry assignment?',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      unreadCount: 2,
      isOnline: true
    },
    {
      id: '2',
      name: 'Mike Chen',
      avatar: '',
      lastMessage: 'Thanks for sharing those notes!',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: 0,
      isOnline: false,
      lastSeen: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Study Group - Physics',
      avatar: '',
      lastMessage: 'Meeting tomorrow at 3 PM',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 5,
      isOnline: true
    }
  ]);

  const [messages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hey! Did you finish the chemistry assignment?',
      senderId: '1',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      isRead: true,
      type: 'text'
    },
    {
      id: '2',
      content: 'Yes, just submitted it. It was quite challenging!',
      senderId: user?.id || 'current-user',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      isRead: true,
      type: 'text'
    },
    {
      id: '3',
      content: 'Could you share your approach to problem 3?',
      senderId: '1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isRead: false,
      type: 'text'
    }
  ]);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    // Here you would typically send the message to your backend
    toast({
      title: "Message sent",
      description: "Your message has been delivered.",
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="h-full flex bg-background">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50",
                  selectedChat === chat.id && "bg-accent"
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {getInitials(chat.name)}
                    </AvatarFallback>
                  </Avatar>
                  {chat.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(chat.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.unreadCount > 0 && (
                  <Badge className="bg-blue-500 text-white ml-2 min-w-[1.25rem] h-5 text-xs flex items-center justify-center">
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedChatData?.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {selectedChatData ? getInitials(selectedChatData.name) : ''}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChatData?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold">{selectedChatData?.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedChatData?.isOnline ? 
                        'Online' : 
                        selectedChatData?.lastSeen ? 
                          `Last seen ${formatTime(selectedChatData.lastSeen)} ago` : 
                          'Offline'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === user?.id || message.senderId === 'current-user';
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-end space-x-2 animate-fade-in",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={selectedChatData?.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                            {selectedChatData ? getInitials(selectedChatData.name) : ''}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm transition-all duration-200 hover:shadow-md",
                        isOwn 
                          ? "bg-blue-500 text-white rounded-br-md" 
                          : "bg-muted rounded-bl-md"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <div className={cn(
                          "flex items-center justify-end space-x-1 mt-1 text-xs",
                          isOwn ? "text-blue-100" : "text-muted-foreground"
                        )}>
                          <span>{formatTime(message.timestamp)}</span>
                          {isOwn && (
                            message.isRead ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )
                          )}
                        </div>
                      </div>

                      {isOwn && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs">
                            {user?.email ? getInitials(user.email) : 'ME'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-end space-x-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-12 rounded-full border-2 focus:border-blue-500 transition-colors"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>

                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="rounded-full bg-blue-500 hover:bg-blue-600 text-white p-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground max-w-sm">
                Select a chat from the sidebar to start messaging with your study partners
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
