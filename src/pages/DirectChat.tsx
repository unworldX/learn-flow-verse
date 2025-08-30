import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, MoreVertical, Phone, Video, Smile, Paperclip } from "lucide-react";
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
      {/* Modern Header */}
      <div className="glass-card border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="rounded-full">
              <Link to="/conversations">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-semibold">
                  {chatUser.full_name?.[0] || chatUser.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="font-semibold text-slate-800 text-lg">
                {chatUser.full_name || chatUser.email.split('@')[0]}
              </h1>
              <p className="text-xs text-green-600 font-medium">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area with Background */}
      <div className="flex-1 flex flex-col relative" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f8fafc' fill-opacity='0.3'%3E%3Cpath d='m0 40l40-40h-40v40z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: '#f8fafc'
      }}>
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-3xl font-bold">
                  {chatUser.full_name?.[0] || chatUser.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {chatUser.full_name || chatUser.email.split('@')[0]}
              </h3>
              <p className="text-slate-500 mb-4">This is the beginning of your conversation</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-sm mx-auto">
                <p className="text-sm text-blue-800">📱 Send your first message to start chatting!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const prevMessage = messages[index - 1];
                const showTime = !prevMessage || 
                  new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000; // 5 minutes
                
                return (
                  <div key={message.id}>
                    {showTime && (
                      <div className="text-center py-2">
                        <span className="text-xs text-slate-500 bg-white/80 px-3 py-1 rounded-full">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 relative ${
                        isOwn
                          ? 'bg-blue-500 text-white rounded-tl-2xl rounded-tr-lg rounded-bl-2xl shadow-md'
                          : 'bg-white text-slate-800 rounded-tr-2xl rounded-tl-lg rounded-br-2xl shadow-md border border-gray-100'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.encrypted_content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwn ? 'text-white/70' : 'text-slate-400'
                        }`}>
                          <span className="text-xs">
                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                          {isOwn && (
                            <div className="text-blue-200 text-xs ml-1">
                              ✓✓
                            </div>
                          )}
                        </div>
                        {/* Message tail */}
                        <div className={`absolute bottom-0 w-3 h-3 ${
                          isOwn 
                            ? 'right-0 bg-blue-500 rounded-bl-full transform translate-x-1' 
                            : 'left-0 bg-white rounded-br-full transform -translate-x-1 border-r border-b border-gray-100'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        {/* Modern Input Field */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0 text-slate-500 hover:text-slate-700">
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="Message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-gray-100 border-0 rounded-full px-4 py-3 text-sm placeholder:text-slate-500 pr-12"
              />
              <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0 text-slate-500 hover:text-slate-700">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 p-0 shrink-0 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectChat;