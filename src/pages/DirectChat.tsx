import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useAuth } from "@/contexts/AuthContext";

const DirectChat = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { messages, chatUsers, fetchMessages, sendMessage } = useDirectMessages();
  const [newMessage, setNewMessage] = useState('');
  const [chatUser, setChatUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
      const user = chatUsers.find(u => u.id === userId);
      setChatUser(user);
    }
  }, [userId, chatUsers]);

  const handleSendMessage = async () => {
    if (!userId || !newMessage.trim()) return;
    
    await sendMessage(userId, newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!chatUser) {
    return (
      <div className="min-h-screen liquid-bg flex items-center justify-center">
        <div className="glass-card p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-600 mt-2">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen liquid-bg flex flex-col">
      {/* WhatsApp-style Header */}
      <div className="glass-card p-3 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="md:hidden">
              <Link to="/conversations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {chatUser.full_name?.[0] || chatUser.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-medium text-slate-800">
                {chatUser.full_name || chatUser.email.split('@')[0]}
              </h1>
              <p className="text-xs text-slate-500">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
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
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        {/* Message Input */}
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
    </div>
  );
};

export default DirectChat;