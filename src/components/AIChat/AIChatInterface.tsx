import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Upload, 
  Bot, 
  User, 
  FileText, 
  Loader2,
  X,
  Trash2,
  History,
  Brain
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  file?: {
    name: string;
    type: string;
    size: number;
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIChatInterfaceProps {
  onClose?: () => void;
}

const AI_MODELS = [
  { id: 'microsoft/phi-4-reasoning-plus:free', name: 'Microsoft Phi-4 Reasoning Plus' },
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 (0528)' },
  { id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', name: 'DeepSeek R1 Qwen3 8B' },
  { id: 'google/gemma-3-27b-it:free', name: 'Google Gemma 3 27B IT' }
];

const AIChatInterface = ({ onClose }: AIChatInterfaceProps) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter_api_key') || '');
  const [showHistory, setShowHistory] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedSessions = localStorage.getItem('ai_chat_sessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setChatSessions(sessions);
      
      // Load the most recent session if available
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[0].id);
      }
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('ai_chat_sessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getCurrentSession = (): ChatSession | undefined => {
    return chatSessions.find(session => session.id === currentSessionId);
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setShowHistory(false);
  };

  const updateSessionTitle = (sessionId: string, firstMessage: string) => {
    setChatSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '') }
        : session
    ));
  };

  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = chatSessions.filter(session => session.id !== sessionId);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const clearAllHistory = () => {
    setChatSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem('ai_chat_sessions');
    setShowHistory(false);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('openrouter_api_key', key);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !apiKey) {
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please enter your OpenRouter API key",
          variant: "destructive"
        });
      }
      return;
    }

    let sessionId = currentSessionId;
    
    // Create new session if none exists
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: newMessage.slice(0, 50) + (newMessage.length > 50 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setChatSessions(prev => [newSession, ...prev]);
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    // Add user message to current session
    setChatSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            messages: [...session.messages, userMessage],
            updatedAt: new Date()
          }
        : session
    ));

    // Update session title if it's the first message
    const currentSession = chatSessions.find(s => s.id === sessionId);
    if (!currentSession || currentSession.messages.length === 0) {
      updateSessionTitle(sessionId, newMessage);
    }

    setNewMessage('');
    setIsLoading(true);

    try {
      const session = chatSessions.find(s => s.id === sessionId);
      const conversationHistory = session ? session.messages : [];

      const systemPrompt = reasoningEnabled 
        ? 'You are a helpful AI assistant for learning and education. Think step by step and show your reasoning process. Help users with their questions, provide explanations, and assist with study materials. Maintain context from previous messages in this conversation.'
        : 'You are a helpful AI assistant for learning and education. Help users with their questions, provide explanations, and assist with study materials. Maintain context from previous messages in this conversation.';

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Learn Flow Verse'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...conversationHistory.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: newMessage
            }
          ],
          temperature: reasoningEnabled ? 0.3 : 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      };

      // Add assistant message to current session
      setChatSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              messages: [...session.messages, assistantMessage],
              updatedAt: new Date()
            }
          : session
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type === 'application/pdf') {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `Uploaded PDF: ${file.name}`,
        timestamp: new Date(),
        file: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      };

      let sessionId = currentSessionId;
      if (!sessionId) {
        createNewSession();
        sessionId = chatSessions[0]?.id;
      }

      setChatSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              messages: [...session.messages, userMessage],
              updatedAt: new Date()
            }
          : session
      ));
      
      toast({
        title: "PDF Upload",
        description: "PDF processing will be implemented soon",
      });
    } else {
      toast({
        title: "File Type Not Supported",
        description: "Only PDF files are supported for now",
        variant: "destructive"
      });
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <Avatar className="w-8 h-8 mr-3 mt-1">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-xs lg:max-w-md ${isUser ? 'ml-12' : 'mr-12'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white ml-auto' 
              : 'bg-white border border-gray-200 text-gray-900'
          } ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}>
            {message.file ? (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{message.file.name}</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
          <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        {isUser && (
          <Avatar className="w-8 h-8 ml-3 mt-1">
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  const currentSession = getCurrentSession();
  const messages = currentSession?.messages || [];

  if (showHistory) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                Chat History
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-2">
                <Button onClick={createNewSession} className="w-full justify-start bg-purple-500 hover:bg-purple-600 text-white mb-4">
                  + New Chat
                </Button>
                
                {chatSessions.length > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Recent Chats</span>
                    <Button variant="ghost" size="sm" onClick={clearAllHistory} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {chatSessions.map((session) => (
                  <div key={session.id} className="group relative">
                    <Button
                      variant={currentSessionId === session.id ? "secondary" : "ghost"}
                      onClick={() => {
                        setCurrentSessionId(session.id);
                        setShowHistory(false);
                      }}
                      className="w-full justify-start text-left h-auto p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{session.title}</div>
                        <div className="text-xs text-gray-500">
                          {session.updatedAt.toLocaleDateString()}
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Card className="h-full flex flex-col border-0 rounded-none">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" />
              AI Assistant
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)}>
                <History className="w-4 h-4" />
              </Button>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* API Key Input */}
          {!apiKey && (
            <div className="space-y-2">
              <Input
                placeholder="Enter OpenRouter API Key"
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Get your API key from{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                  OpenRouter
                </a>
              </p>
            </div>
          )}

          {/* Model Selection */}
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{model.name}</span>
                    <Badge variant="secondary" className="text-xs">Free</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reasoning Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <label htmlFor="reasoning" className="text-sm font-medium">
                Reasoning Mode
              </label>
            </div>
            <Switch
              id="reasoning"
              checked={reasoningEnabled}
              onCheckedChange={setReasoningEnabled}
            />
          </div>

          {/* New Chat Button */}
          {messages.length > 0 && (
            <Button onClick={createNewSession} variant="outline" className="w-full">
              + New Chat
            </Button>
          )}
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Start a conversation with the AI assistant</p>
                <p className="text-sm mt-2">Ask questions, upload PDFs for summary, or get help with your studies</p>
              </div>
            ) : (
              <div>
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <Avatar className="w-8 h-8 mr-3 mt-1">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="pr-12 rounded-full"
                  disabled={isLoading || !apiKey}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !newMessage.trim() || !apiKey}
                className="rounded-full px-6 bg-purple-500 hover:bg-purple-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatInterface;
