import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Paperclip, Brain, Bot, Trash2, RotateCcw, Plus, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createChatCompletion, deleteChatSession, getChatMessages, getChatSessions, uploadPdf, createChatSession } from "@/lib/api";
import { ChatMessage, ChatSession } from "@/types";

// AI Models configuration organized by provider
const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: {
      'gpt-4o-mini': { name: 'GPT-4o Mini', description: 'Fast and efficient' },
      'gpt-4o': { name: 'GPT-4o', description: 'Most capable' },
      'gpt-4-turbo': { name: 'GPT-4 Turbo', description: 'High performance' },
      'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', description: 'Balanced option' }
    }
  },
  anthropic: {
    name: 'Anthropic',
    models: {
      'claude-3-opus': { name: 'Claude 3 Opus', description: 'Most powerful' },
      'claude-3-sonnet': { name: 'Claude 3 Sonnet', description: 'Balanced reasoning' },
      'claude-3-haiku': { name: 'Claude 3 Haiku', description: 'Fast responses' }
    }
  },
  google: {
    name: 'Google',
    models: {
      'gemini-pro': { name: 'Gemini Pro', description: 'Advanced AI' },
      'gemini-pro-vision': { name: 'Gemini Pro Vision', description: 'Multimodal' }
    }
  },
  deepseek: {
    name: 'DeepSeek',
    models: {
      'deepseek-chat': { name: 'DeepSeek Chat', description: 'Conversational AI' },
      'deepseek-coder': { name: 'DeepSeek Coder', description: 'Code specialist' }
    }
  }
};

// Get current model info
const getCurrentModelInfo = (modelId: string) => {
  for (const provider of Object.values(AI_PROVIDERS)) {
    if (provider.models[modelId as keyof typeof provider.models]) {
      return {
        provider: provider.name,
        model: provider.models[modelId as keyof typeof provider.models]
      };
    }
  }
  return { provider: 'Unknown', model: { name: modelId, description: '' } };
};

export default function AIChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>('session-1');

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

  // Mutation for uploading a PDF
  const { mutate: uploadFileMutation } = useMutation({
    mutationFn: uploadPdf,
    onSuccess: () => {
      toast({
        title: "File uploaded!",
        description: "The PDF has been successfully uploaded.",
      });
      setUploadedFile(null);
    },
    onError: () => {
      toast({
        title: "Something went wrong!",
        description: "There was an error uploading the file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    console.log('Sending message:', input, 'with model:', selectedModel);
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

    // Create AI completion with selected model
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const formData = new FormData();
    formData.append('file', file);

    uploadFileMutation(formData);
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

  const currentModelInfo = getCurrentModelInfo(selectedModel);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Session Management Bar */}
      <div className="border-b bg-white/90 backdrop-blur-sm px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Select value={currentSessionId || ""} onValueChange={switchSession}>
              <SelectTrigger className="w-64 h-10 bg-white shadow-sm border-gray-200 hover:border-gray-300 transition-colors">
                <SelectValue placeholder="Select or create a session..." />
              </SelectTrigger>
              <SelectContent>
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

            {/* Provider-based Model Selection Dropdown */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-56 h-10 bg-white shadow-sm border-gray-200 hover:border-gray-300 transition-colors">
                <SelectValue placeholder="Select model...">
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">{currentModelInfo.model.name}</span>
                    <span className="text-xs text-gray-500">{currentModelInfo.provider}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AI_PROVIDERS).map(([providerId, provider]) => (
                  <SelectGroup key={providerId}>
                    <SelectLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">
                      {provider.name}
                    </SelectLabel>
                    {Object.entries(provider.models).map(([modelId, model]) => (
                      <SelectItem key={modelId} value={modelId}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-gray-500">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={createNewSession} variant="outline" size="sm" className="gap-2 h-10 px-4 bg-white hover:bg-gray-50 border-gray-200">
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {currentSessionId && currentSessionId !== 'session-1' && (
              <Button
                onClick={() => deleteSession(currentSessionId)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 px-4 border-red-200 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            <Button onClick={clearChat} variant="outline" size="sm" className="gap-2 h-10 px-4 bg-white hover:bg-gray-50 border-gray-200">
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
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
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to AI Assistant</h3>
                <p className="text-gray-600 max-w-lg mx-auto text-lg leading-relaxed">
                  Start a conversation with our AI assistant. Ask questions, get help with your studies, or explore new topics together.
                </p>
                <div className="mt-6 text-sm text-gray-500">
                  Current model: <span className="font-medium text-gray-700">{currentModelInfo.model.name}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500">{currentModelInfo.provider}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((message, index) => (
                  <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {message.role !== 'user' && (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className={`flex flex-col gap-2 max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`px-6 py-4 rounded-3xl shadow-sm border text-[15px] leading-relaxed whitespace-pre-wrap ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-800 border-gray-100 shadow-md'
                        }`}
                      >
                        {message.content}
                      </div>
                      <span className="text-xs text-gray-500 px-2">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isLoading && (
              <div className="flex items-start gap-4 mt-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="px-6 py-4 rounded-3xl bg-gray-100 text-gray-600 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking with {currentModelInfo.model.name}...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="border-t bg-white/90 backdrop-blur-sm shadow-lg">
          <div className="max-w-4xl mx-auto p-6">
            {/* PDF Upload Section */}
            {uploadedFile && (
              <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">
                  Uploaded File: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                </p>
              </div>
            )}
            
            {/* Message Input */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={reasoning ? "Ask with detailed reasoning..." : "Type your message..."}
                    className="min-h-[56px] max-h-32 resize-none pr-32 text-base bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-2xl shadow-sm"
                    disabled={isLoading}
                  />
                  
                  {/* Reasoning Toggle */}
                  <div className="absolute right-3 top-3">
                    <Button
                      onClick={() => setReasoning(!reasoning)}
                      variant={reasoning ? "default" : "outline"}
                      size="sm"
                      className={`gap-2 text-xs h-8 px-3 rounded-xl transition-all ${
                        reasoning 
                          ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md" 
                          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                      type="button"
                    >
                      <Brain className="w-3 h-3" />
                      {reasoning ? "ON" : "OFF"}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                  disabled={isLoading}
                  className="shrink-0 h-14 w-14 rounded-2xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </Button>
                
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
