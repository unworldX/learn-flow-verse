import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Brain,
  Plus,
  Settings
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

const AIChatInterface = ({ onClose }: AIChatInterfaceProps) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get settings from localStorage
  const apiProvider = localStorage.getItem('ai_provider') || 'openrouter';
  const selectedModel = localStorage.getItem('ai_model') || 'microsoft/phi-4-reasoning-plus:free';
  const apiKey = localStorage.getItem(`${apiProvider}_api_key`) || '';

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !apiKey) {
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please configure your API key in Settings",
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

      let apiUrl = '';
      let requestBody: any = {};

      // Configure API based on provider
      if (apiProvider === 'openrouter') {
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        requestBody = {
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: newMessage }
          ],
          temperature: reasoningEnabled ? 0.3 : 0.7,
          max_tokens: 1000
        };
      }
      // Add other providers as needed...

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Learn Flow Verse'
        },
        body: JSON.stringify(requestBody)
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
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        {!isUser && (
          <Avatar className="w-9 h-9 mr-3 mt-1 ring-2 ring-purple-100">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              <Bot className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-[75%] ${isUser ? 'ml-12' : 'mr-12'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
            isUser 
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white ml-auto shadow-purple-200' 
              : 'bg-white border border-gray-100 text-gray-900 shadow-gray-100'
          } ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
            {message.file ? (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">{message.file.name}</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
          <div className={`flex items-center gap-1 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-400 font-medium">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        {isUser && (
          <Avatar className="w-9 h-9 ml-3 mt-1 ring-2 ring-green-100">
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <User className="w-5 h-5" />
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
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="h-full flex flex-col border-0 shadow-xl">
          <CardHeader className="pb-6 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Chat History</h2>
                  <p className="text-sm text-gray-500">Manage your conversations</p>
                </div>
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-6">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <Button 
                  onClick={createNewSession} 
                  className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Conversation
                </Button>
                
                {chatSessions.length > 0 && (
                  <div className="flex justify-between items-center pt-4 pb-2">
                    <span className="text-sm font-semibold text-gray-700">Recent Conversations</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllHistory} 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {chatSessions.map((session) => (
                    <div key={session.id} className="group relative">
                      <Button
                        variant={currentSessionId === session.id ? "secondary" : "ghost"}
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          setShowHistory(false);
                        }}
                        className={`w-full justify-start text-left h-auto p-4 rounded-xl transition-all duration-200 ${
                          currentSessionId === session.id 
                            ? 'bg-purple-50 border border-purple-200 shadow-sm' 
                            : 'hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate mb-1">{session.title}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{session.updatedAt.toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{session.messages.length} messages</span>
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
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="h-full flex flex-col border-0 shadow-xl">
        {/* Enhanced Header */}
        <CardHeader className="pb-6 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
                <p className="text-sm text-gray-500">
                  {apiProvider} • {selectedModel.split('/').pop()?.split(':')[0]}
                </p>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowHistory(true)}
                className="rounded-full hover:bg-gray-100"
              >
                <History className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.location.href = '/settings'}
                className="rounded-full hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </Button>
              {onClose && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Enhanced API Key Warning */}
          {!apiKey && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800">API Configuration Required</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Configure your API provider and key in{' '}
                    <a href="/settings" className="text-purple-600 hover:text-purple-700 font-medium underline">
                      Settings → AI
                    </a>{' '}
                    to start chatting.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced New Chat Button */}
          {messages.length > 0 && (
            <Button 
              onClick={createNewSession} 
              variant="outline" 
              className="w-full mt-4 h-12 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Start New Conversation
            </Button>
          )}
        </CardHeader>

        {/* Enhanced Messages Area */}
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl w-16 h-16 mx-auto mb-6">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to AI Assistant</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  I'm here to help with your questions, provide explanations, and assist with your studies.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
                    Ask questions
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
                    Upload PDFs
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
                    Get study help
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="flex justify-start mb-6">
                    <Avatar className="w-9 h-9 mr-3 mt-1 ring-2 ring-purple-100">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Enhanced Input Area */}
          <div className="p-6 bg-white border-t border-gray-100">
            {/* Enhanced Reasoning Toggle */}
            <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="p-1.5 bg-purple-500 rounded-lg">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <label htmlFor="reasoning" className="text-sm font-medium text-gray-700">
                Reasoning Mode
              </label>
              <Switch
                id="reasoning"
                checked={reasoningEnabled}
                onCheckedChange={setReasoningEnabled}
                className="data-[state=checked]:bg-purple-500"
              />
              <span className="text-xs text-gray-500">
                {reasoningEnabled ? 'Think step by step' : 'Quick responses'}
              </span>
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={reasoningEnabled ? "Ask me to think through a problem step by step..." : "Type your message..."}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="pr-12 rounded-2xl border-2 border-gray-200 focus:border-purple-300 h-12 text-sm bg-white shadow-sm"
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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-gray-100"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !newMessage.trim() || !apiKey}
                className="rounded-2xl px-6 h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
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
