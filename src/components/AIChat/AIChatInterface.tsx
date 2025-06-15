
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, Trash2, RotateCcw, Plus, Brain, Settings, MessageSquare, Users, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createChatCompletion, deleteChatSession, getChatMessages, getChatSessions, createChatSession } from "@/lib/api";
import { ChatMessage, ChatSession } from "@/types";
import { Badge } from "@/components/ui/badge";

export default function AIChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>('session-1');

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch chat sessions
  const { data: sessions = [], refetch: refetchSessions } = useQuery<ChatSession[]>({
    queryKey: ['chatSessions'],
    queryFn: getChatSessions,
  });

  // Fetch chat messages for the current session
  const { data: initialMessages = [], refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: ['chatMessages', currentSessionId],
    queryFn: () => getChatMessages(currentSessionId || ''),
    enabled: !!currentSessionId,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Mutation for creating a chat completion
  const { mutate: createCompletion } = useMutation({
    mutationFn: createChatCompletion,
    onSuccess: (newMessage) => {
      console.log('Chat completion successful:', newMessage);
      setMessages((prev) => [...prev, newMessage]);
      setInput('');
      setIsLoading(false);
      
      // Refresh messages for the current session
      if (currentSessionId) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', currentSessionId] });
      }
    },
    onError: (error) => {
      console.error('Chat completion error:', error);
      toast({
        title: "Something went wrong!",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  // Mutation for deleting a chat session
  const { mutate: deleteSessionMutation } = useMutation({
    mutationFn: deleteChatSession,
    onSuccess: () => {
      toast({
        title: "Session deleted!",
        description: "The chat session has been successfully deleted.",
      });
      setCurrentSessionId('session-1');
      setMessages([]);
      refetchSessions();
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
    onError: () => {
      toast({
        title: "Something went wrong!",
        description: "There was an error deleting the session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating a new session
  const { mutate: createNewSessionMutation } = useMutation({
    mutationFn: (name: string) => createChatSession(name),
    onSuccess: (newSession) => {
      console.log('New session created:', newSession);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      refetchSessions();
      toast({
        title: "New session created!",
        description: `Created "${newSession.name}" successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Something went wrong!",
        description: "There was an error creating a new session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    console.log('Sending message:', input);
    setIsLoading(true);
    const messageContent = input.trim();

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Clear input immediately
    setInput('');

    // Create AI completion
    createCompletion({
      sessionId: currentSessionId || undefined,
      message: messageContent,
      reasoning: reasoning,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (currentSessionId) {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', currentSessionId] });
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const switchSession = (sessionId: string) => {
    console.log('Switching to session:', sessionId);
    setCurrentSessionId(sessionId);
    queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
  };

  const createNewSession = () => {
    const newSessionName = `Chat Session ${(sessions?.length || 0) + 1}`;
    createNewSessionMutation(newSessionName);
  };

  const deleteSession = (sessionId: string) => {
    if (sessionId === 'session-1') {
      toast({
        title: "Cannot delete default session",
        description: "The default session cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    deleteSessionMutation(sessionId);
  };

  const currentSession = sessions?.find(s => s.id === currentSessionId);
  const messageCount = messages.length;
  const userMessageCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
      {/* Professional Header */}
      <div className="border-b bg-white/95 backdrop-blur-sm shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              {/* AI Assistant Brand */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">AI Assistant</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant={isOnline ? "default" : "destructive"} className="text-xs px-2 py-0.5">
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                    <span className="text-xs text-gray-500">Ready to help</span>
                  </div>
                </div>
              </div>

              {/* Session Selector */}
              <div className="ml-6">
                <Select value={currentSessionId || ""} onValueChange={switchSession}>
                  <SelectTrigger className="w-64 h-10 bg-white shadow-sm border-gray-200 hover:border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue placeholder="Select session...">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="font-medium truncate">
                          {currentSession?.name || "Select session..."}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-64">
                    {sessions?.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate max-w-40 font-medium">{session.name}</span>
                          <span className="text-xs text-gray-500 ml-3">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={createNewSession} variant="outline" size="sm" className="gap-2 h-10 px-4 bg-white hover:bg-gray-50 border-gray-200 transition-all duration-200 hover:border-blue-300 hover:shadow-sm">
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center gap-4">
              {/* Chat Statistics */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{messageCount} messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{userMessageCount} from you</span>
                </div>
                {currentSession && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(currentSession.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {currentSessionId && currentSessionId !== 'session-1' && (
                  <Button
                    onClick={() => deleteSession(currentSessionId)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 px-4 border-red-200 hover:border-red-300 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                
                <Button onClick={clearChat} variant="outline" size="sm" className="gap-2 h-10 px-4 bg-white hover:bg-gray-50 border-gray-200 transition-all duration-200 hover:border-blue-300 hover:shadow-sm">
                  <RotateCcw className="w-4 h-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                    <Bot className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Welcome to AI Assistant</h3>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed mb-8">
                  Your intelligent companion for learning, research, and creative work. Ask questions, explore ideas, 
                  or get help with any task you're working on.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Smart Conversations</h4>
                    <p className="text-sm text-gray-600">Engage in natural, context-aware discussions</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      <Brain className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Deep Reasoning</h4>
                    <p className="text-sm text-gray-600">Get detailed analysis and step-by-step thinking</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                      <Settings className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Personalized</h4>
                    <p className="text-sm text-gray-600">Tailored responses based on your preferences</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((message, index) => (
                  <div key={index} className={`flex items-start gap-4 group ${message.role === 'user' ? 'flex-row-reverse' : ''} transition-all duration-300 hover:scale-[1.01]`}>
                    {message.role !== 'user' && (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:shadow-xl transition-all duration-300">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {message.role === 'user' && (
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:shadow-xl transition-all duration-300">
                        <span className="text-white font-semibold text-sm">You</span>
                      </div>
                    )}
                    <div className={`flex flex-col gap-2 max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`px-6 py-4 rounded-3xl shadow-sm border text-[15px] leading-relaxed whitespace-pre-wrap transition-all duration-300 group-hover:shadow-lg ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600 shadow-blue-200/50' 
                            : 'bg-white text-gray-800 border-gray-100 shadow-gray-200/50 hover:border-gray-200'
                        }`}
                      >
                        {message.content}
                      </div>
                      <div className={`flex items-center gap-2 px-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.role !== 'user' && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            AI Response
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isLoading && (
              <div className="flex items-start gap-4 mt-8 animate-fade-in">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="px-6 py-4 rounded-3xl bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="font-medium">AI is thinking...</span>
                    {reasoning && (
                      <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">
                        Deep reasoning mode
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Input Section */}
        <div className="border-t bg-white/95 backdrop-blur-sm shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
          <div className="relative max-w-4xl mx-auto p-6">
            {/* Message Input */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <div className="relative group">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={reasoning ? "Ask with detailed reasoning and analysis..." : "Type your message here..."}
                    className="min-h-[64px] max-h-32 resize-none pr-20 text-base bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-2xl shadow-sm transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                    disabled={isLoading}
                  />
                  
                  {/* Reasoning Toggle */}
                  <div className="absolute right-3 top-3">
                    <Button
                      onClick={() => setReasoning(!reasoning)}
                      variant={reasoning ? "default" : "outline"}
                      size="sm"
                      className={`gap-2 text-xs h-8 px-3 rounded-xl transition-all duration-300 ${
                        reasoning 
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl" 
                          : "bg-white hover:bg-purple-50 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700"
                      }`}
                      type="button"
                    >
                      <Brain className="w-3 h-3" />
                      <span className="font-medium">{reasoning ? "Deep Mode" : "Standard"}</span>
                    </Button>
                  </div>
                </div>
                
                {/* Input Helper Text */}
                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    {reasoning && (
                      <Badge variant="outline" className="text-xs border-purple-200 text-purple-600 bg-purple-50">
                        Reasoning enabled
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {input.length}/2000
                  </div>
                </div>
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim() || !isOnline}
                className="shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
