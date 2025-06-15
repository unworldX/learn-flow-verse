import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Paperclip, Brain, Bot, Trash2, RotateCcw, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createChatCompletion, deleteChatSession, getChatMessages, getChatSessions, uploadPdf } from "@/lib/api";
import { ChatMessage } from "@/types";

export default function AIChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Fetch chat sessions
  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: getChatSessions,
  });

  // Fetch chat messages for the current session
  const { data: initialMessages = [], refetch: refetchMessages } = useQuery({
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
      setMessages((prev) => [...prev, newMessage]);
      setInput('');
      setIsLoading(false);
    },
    onError: () => {
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
      setCurrentSessionId(null);
      setMessages([]);
      refetchSessions();
    },
    onError: () => {
      toast({
        title: "Something went wrong!",
        description: "There was an error deleting the session. Please try again.",
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
    setIsLoading(true);
    const messageContent = input.trim();

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
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    queryClient.invalidateQueries(['chatMessages', sessionId]);
  };

  const createNewSession = () => {
    const newSessionName = `Chat Session ${sessions.length + 1}`;
    const newSessionId = Math.random().toString(36).substring(7);

    // Optimistically update the sessions list
    queryClient.setQueryData(['chatSessions'], (oldSessions: any) => [
      ...oldSessions,
      { id: newSessionId, name: newSessionName, createdAt: new Date() },
    ]);

    setCurrentSessionId(newSessionId);
    setMessages([]);
    refetchSessions(); // Refresh the sessions list from the server
  };

  const deleteSession = (sessionId: string) => {
    deleteSessionMutation(sessionId);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Session Management Bar */}
      <div className="border-b bg-white/80 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={currentSessionId || ""} onValueChange={switchSession}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select or create a session..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate max-w-48">{session.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={createNewSession} variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {currentSessionId && (
              <Button
                onClick={() => deleteSession(currentSessionId)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            <Button onClick={clearChat} variant="outline" size="sm" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to AI Assistant</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Start a conversation with our AI assistant. Ask questions, get help with your studies, or just chat!
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role !== 'user' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5 max-w-[80%]">
                    <div className="px-4 py-2 rounded-xl shadow-md text-sm" style={{ backgroundColor: message.role === 'user' ? '#e2e8f0' : 'white' }}>
                      {message.content}
                    </div>
                    <span className="text-xs text-gray-500">{new Date(message.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-500 animate-pulse" />
                </div>
                <div className="px-4 py-2 rounded-xl bg-gray-100 text-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="border-t bg-white/80 backdrop-blur-sm p-6">
          <div className="max-w-4xl mx-auto">
            {/* PDF Upload Section */}
            {uploadedFile && (
              <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-700">
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
                    className="min-h-[60px] max-h-32 resize-none pr-32 text-base"
                    disabled={isLoading}
                  />
                  
                  {/* Reasoning Toggle */}
                  <div className="absolute right-3 top-3">
                    <Button
                      onClick={() => setReasoning(!reasoning)}
                      variant={reasoning ? "default" : "outline"}
                      size="sm"
                      className="gap-2 text-xs"
                      type="button"
                    >
                      <Brain className="w-3 h-3" />
                      {reasoning ? "Reasoning ON" : "Reasoning OFF"}
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
                  className="shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
