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
import { ChatMessage, ChatSession, CreateChatCompletionParams } from "@/types";

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
  const { mutate: createCompletion } = useMutation<ChatMessage, Error, CreateChatCompletionParams>({
    mutationFn: createChatCompletion,
    onSuccess: (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      setInput('');
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Chat completion error:", error);
      toast({
        title: "Something went wrong!",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  // Mutation for deleting a chat session
  const { mutate: deleteSessionMutation } = useMutation<void, Error, string>({
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
  const { mutate: uploadFileMutation } = useMutation<void, Error, FormData>({
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

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

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
    queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
  };

  const createNewSession = () => {
    const newSessionName = `Chat Session ${sessions.length + 1}`;
    const newSessionId = Math.random().toString(36).substring(7);

    // Optimistically update the sessions list
    queryClient.setQueryData(['chatSessions'], (oldSessions: ChatSession[] | undefined) => [
      ...(oldSessions || []),
      { id: newSessionId, name: newSessionName, createdAt: new Date().toISOString() },
    ]);

    setCurrentSessionId(newSessionId);
    setMessages([]);
    refetchSessions(); // Refresh the sessions list from the server
  };

  const deleteSession = (sessionId: string) => {
    deleteSessionMutation(sessionId);
  };

  return (
    <div className="flex h-full w-full flex-col bg-muted/20">
      {/* Top Header */}
      <header className="flex h-20 items-center justify-between border-b bg-background px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">AI Chat</h1>
          <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-700">
            AI Powered
          </Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Session Management Bar */}
        <div className="w-80 border-r bg-background p-4">
          <div className="flex flex-col gap-4">
            <Button onClick={createNewSession} variant="outline" className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Select value={currentSessionId || ""} onValueChange={switchSession}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex w-full items-center justify-between">
                      <span className="truncate">{session.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentSessionId && (
              <Button
                onClick={() => deleteSession(currentSessionId)}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete Session
              </Button>
            )}
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-4xl space-y-8">
              {messages.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 shadow-lg">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-gray-900">
                    AI Assistant
                  </h3>
                  <p className="mx-auto max-w-lg text-lg leading-relaxed text-gray-600">
                    How can I help you today?
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role !== 'user' && (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                        message.role === 'user'
                          ? 'rounded-br-none bg-blue-600 text-white'
                          : 'rounded-bl-none border border-border bg-card text-card-foreground'
                      }`}
                    >
                      <p className="leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                    <Bot className="h-5 w-5 animate-pulse text-white" />
                  </div>
                  <div className="max-w-[75%] rounded-2xl rounded-bl-none border border-border bg-card px-5 py-3 text-card-foreground shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Section */}
          <div className="border-t bg-background/80 p-6 backdrop-blur-sm">
            <div className="mx-auto max-w-4xl">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={reasoning ? "Ask with detailed reasoning..." : "Type your message..."}
                  className="min-h-[56px] w-full resize-none rounded-2xl border-border bg-card p-4 pr-32 text-base shadow-sm"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                  <Button
                    onClick={() => setReasoning(!reasoning)}
                    variant={reasoning ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2 rounded-xl"
                  >
                    <Brain className={`h-4 w-4 ${reasoning ? 'text-primary' : ''}`} />
                    Reasoning
                  </Button>
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground"
                    size="icon"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
