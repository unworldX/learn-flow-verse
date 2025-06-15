import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, Trash2, RotateCcw, Plus, Brain, Settings, MessageSquare, Users, Clock, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createChatCompletion, deleteChatSession, getChatMessages, getChatSessions, createChatSession } from "@/lib/api";
import { ChatMessage, ChatSession } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from '@/hooks/use-mobile';

const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient' },
    ],
    color: 'from-green-500 to-emerald-600'
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Quick responses' },
    ],
    color: 'from-orange-500 to-red-600'
  },
  google: {
    name: 'Google',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Advanced reasoning' },
    ],
    color: 'from-blue-500 to-indigo-600'
  },
  deepseek: {
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'Coding specialist' },
    ],
    color: 'from-purple-500 to-violet-600'
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o via OpenRouter', description: 'OpenAI via OpenRouter' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet via OpenRouter', description: 'Anthropic via OpenRouter' },
    ],
    color: 'from-gray-500 to-slate-600'
  }
};

export default function AIChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  
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
      model: selectedModel,
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
  const currentProviderData = AI_PROVIDERS[selectedProvider as keyof typeof AI_PROVIDERS];
  const currentModelData = currentProviderData?.models.find(m => m.id === selectedModel);

  const isMobile = useIsMobile();

  return (
    <div className={
      `flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden
      ${isMobile ? 'rounded-none shadow-none min-h-screen' : ''}`
    }>
      {/* Header */}
      <div className={
        `border-b bg-white/95 backdrop-blur-sm shadow-sm relative overflow-hidden
        ${isMobile ? 'py-2' : ''}`
      }>
        {/* Enhanced Professional Header */}
        <div className={`relative px-4 ${isMobile ? 'py-2' : 'py-4'}`}>
          <div className={
            `flex items-center ${isMobile ? 'gap-3 flex-wrap' : 'justify-between'} max-w-7xl mx-auto`
          }>
            <div className="flex items-center gap-3">
              {/* AI Assistant Brand */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${isMobile ? 'rounded-xl' : 'rounded-2xl'} bg-gradient-to-br ${currentProviderData?.color || 'from-blue-600 via-purple-600 to-indigo-600'} flex items-center justify-center shadow-lg`}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold text-gray-900 ${isMobile ? 'tracking-tight' : 'text-xl'}`}>AI Assistant</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant={isOnline ? "default" : "destructive"} className="text-xs px-1.5 py-0.5">
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                    <span className="text-xs text-gray-500">{isMobile ? "" : "Ready to help"}</span>
                    {currentModelData && (
                      <Badge variant="outline" className="text-2xs px-1.5 py-0.5 bg-gradient-to-r from-gray-50 to-gray-100">
                        {currentProviderData.name} · {currentModelData.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Provider & Model Selection */}
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 h-10 px-4 bg-white hover:bg-gray-50 border-gray-200 transition-all duration-200 hover:border-blue-300 hover:shadow-sm">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${currentProviderData?.color}`}></div>
                      <span className="font-medium">{currentProviderData?.name}</span>
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => {
                          setSelectedProvider(key);
                          setSelectedModel(provider.models[0].id);
                        }}
                        className="flex items-center gap-3"
                      >
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${provider.color}`}></div>
                        <span>{provider.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-56 h-10 bg-white shadow-sm border-gray-200 hover:border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-gray-500" />
                        <span className="font-medium truncate">
                          {currentModelData?.name || 'Select model...'}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-56">
                    {currentProviderData?.models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-gray-500">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Session Selector */}
              <div className="ml-2">
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
        {isMobile && (
          <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 px-3 h-8 bg-white border-gray-200 text-xs">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${currentProviderData?.color}`} />
                  {currentProviderData?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 z-[60]">
                {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => {
                      setSelectedProvider(key);
                      setSelectedModel(provider.models[0].id);
                    }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${provider.color}`} />
                    <span>{provider.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-32 h-8 text-xs bg-white shadow border-gray-200">
                <SelectValue>
                  <span className="font-medium truncate">{currentModelData?.name || 'Model...'}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-32 z-[60]">
                {currentProviderData?.models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <span className="font-medium text-xs">{model.name}</span>
                    <span className="block text-2xs text-gray-500">{model.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={currentSessionId || ""} onValueChange={switchSession}>
              <SelectTrigger className="w-32 h-8 text-xs bg-white shadow border-gray-200">
                <SelectValue placeholder="Session...">
                  <span className="font-medium truncate">
                    {currentSession?.name || "Session..."}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-32 z-[60]">
                {sessions?.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    <span className="truncate max-w-20 font-medium text-xs">{session.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={createNewSession} variant="outline" size="sm" className="px-2 h-8 text-xs">New</Button>
            {currentSessionId && currentSessionId !== 'session-1' && (
              <Button onClick={() => deleteSession(currentSessionId)} variant="outline" size="icon" className="text-red-600 h-8 w-8 px-0">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            <Button onClick={clearChat} variant="outline" size="icon" className="h-8 w-8 px-0">
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Chat messages area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'pb-24' : ''}`}>
        {/* Messages */}
        <div className={`flex-1 overflow-y-auto transition-all ${isMobile ? 'px-2 py-2' : 'max-w-4xl mx-auto px-6 py-8'}`}>
          {messages.length === 0 ? (
            <div className={`text-center ${isMobile ? 'py-6' : 'py-16'}`}>
              {/* Welcome and features for empty chat */}
              <div className={`relative mb-6 ${isMobile ? 'mb-3' : 'mb-8'}`}>
                <div className={`w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br ${currentProviderData?.color || 'from-blue-500 via-purple-500 to-indigo-600'} rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto shadow-xl`}>
                  <Bot className="w-8 h-8 md:w-12 md:h-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 md:w-6 md:h-6 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
              </div>
              <h3 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">Welcome to AI Assistant</h3>
              <p className="text-gray-600 max-w-md mx-auto text-base md:text-lg leading-relaxed mb-4">
                Your AI companion powered by {currentProviderData?.name} {currentModelData?.name}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 max-w-lg mx-auto">
                <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs md:text-base">Smart Chat</h4>
                  <p className="text-xs md:text-sm text-gray-600">Natural discussion.</p>
                </div>
                <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs md:text-base">Reasoning</h4>
                  <p className="text-xs md:text-sm text-gray-600">Detailed explanations.</p>
                </div>
                <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                    <Settings className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs md:text-base">Models</h4>
                  <p className="text-xs md:text-sm text-gray-600">Choose your AI.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-8">
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-2 md:gap-4 group ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {message.role !== 'user' ? (
                    <div className={`w-7 h-7 md:w-10 md:h-10 bg-gradient-to-br ${currentProviderData?.color || 'from-blue-500 via-purple-500 to-indigo-600'} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg`}>
                      <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 md:w-10 md:h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-semibold text-xs md:text-sm">You</span>
                    </div>
                  )}
                  <div className={`flex flex-col gap-1 md:gap-2 max-w-[88vw] md:max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl shadow-sm border text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap transition-all duration-300 
                      ${message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600 shadow-blue-200/50'
                        : 'bg-white text-gray-800 border-gray-100 shadow-gray-200/50 hover:border-gray-200'}`}
                    >
                      {message.content}
                    </div>
                    <div className={`flex items-center gap-1 md:gap-2 px-1 text-xs md:text-xs ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-500">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {message.role !== 'user' && (
                        <Badge variant="secondary" className="text-2xs px-1.5 py-0.5">{currentProviderData?.name} Response</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="flex items-start gap-3 mt-4 md:mt-8 animate-fade-in">
              <div className={`w-7 h-7 md:w-10 md:h-10 bg-gradient-to-br ${currentProviderData?.color || 'from-blue-500 via-purple-500 to-indigo-600'} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg`}>
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-white animate-pulse" />
              </div>
              <div className="px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 shadow-sm border border-gray-100">
                <span className="font-medium">{currentProviderData?.name} is thinking...</span>
                {reasoning && (
                  <Badge variant="outline" className="text-2xs md:text-xs border-purple-200 text-purple-700 bg-purple-50 ml-2">Deep reasoning</Badge>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input section (mobile: always docked, full width & large tap) */}
      <div className={`border-t bg-white/95 backdrop-blur-sm shadow-2xl relative ${isMobile ? 'fixed bottom-0 left-0 right-0 z-50 p-2' : ''}`}>
        {/* Enhanced Input Section */}
        <div className={`relative ${isMobile ? 'max-w-full p-0' : 'max-w-4xl mx-auto p-6'}`}>
          <div className="flex gap-2 md:gap-4 items-end">
            <div className="flex-1">
              <div className={`relative group`}>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={reasoning
                    ? "Ask with detailed reasoning and analysis..."
                    : `Type your message for ${currentProviderData?.name} ${currentModelData?.name}...`
                  }
                  className={
                    `min-h-[48px] max-h-32 resize-none pr-20 text-base bg-white border-gray-200
                    focus:border-blue-400 focus:ring-blue-400/20 rounded-xl md:rounded-2xl shadow-sm
                    transition-all duration-300 group-hover:shadow-md focus:shadow-lg
                    ${isMobile ? 'py-3 px-4 h-14 text-base' : ''}`
                  }
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-2">
                  <Button
                    onClick={() => setReasoning(!reasoning)}
                    variant={reasoning ? "default" : "outline"}
                    size="sm"
                    className={`gap-2 text-xs h-8 md:h-8 px-2 md:px-3 rounded-lg md:rounded-xl transition-all duration-300
                      ${reasoning
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                        : "bg-white hover:bg-purple-50 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700"
                      }`}
                    type="button"
                  >
                    <Brain className="w-3 h-3" />
                    <span className={`font-medium hidden md:block`}>{reasoning ? "Deep Mode" : "Standard"}</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1 md:mt-2 px-1 text-xs text-gray-500">
                <span>{isMobile ? "Send: " : "Press Enter to send,"} Shift+Enter for new line</span>
                {reasoning && (
                  <Badge variant="outline" className="text-xs border-purple-200 text-purple-600 bg-purple-50">Reasoning enabled</Badge>
                )}
                <span className="text-xs text-gray-400 ml-auto">{input.length}/2000</span>
              </div>
            </div>
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !isOnline}
              className={`shrink-0 h-14 md:h-16 w-14 md:w-16 rounded-xl md:rounded-2xl text-white shadow-xl hover:shadow-2xl
                transition-all duration-300 bg-gradient-to-r
                ${currentProviderData?.color || 'from-blue-600 via-purple-600 to-indigo-600'}
                disabled:opacity-50 disabled:cursor-not-allowed group`}
            >
              {isLoading
                ? <Loader2 className="w-6 h-6 animate-spin" />
                : <Send className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
