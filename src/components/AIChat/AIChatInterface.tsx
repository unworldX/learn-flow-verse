
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Upload, 
  Bot, 
  User, 
  FileText, 
  Loader2,
  X,
  Minimize2,
  Maximize2
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

interface AIChatInterfaceProps {
  isFloating?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMinimized?: boolean;
}

const AI_MODELS = [
  { id: 'microsoft/phi-4-reasoning-plus:free', name: 'Microsoft Phi-4 Reasoning Plus' },
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 (0528)' },
  { id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', name: 'DeepSeek R1 Qwen3 8B' },
  { id: 'google/gemma-3-27b-it:free', name: 'Google Gemma 3 27B IT' }
];

const AIChatInterface = ({ 
  isFloating = false, 
  onClose, 
  onMinimize, 
  onMaximize,
  isMinimized = false 
}: AIChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter_api_key') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
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
              content: 'You are a helpful AI assistant for learning and education. Help users with their questions, provide explanations, and assist with study materials.'
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: newMessage
            }
          ],
          temperature: 0.7,
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

      setMessages(prev => [...prev, assistantMessage]);
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
      // Handle PDF upload and summary
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

      setMessages(prev => [...prev, userMessage]);
      
      // TODO: Implement PDF processing
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

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMaximize}
          className="rounded-full w-14 h-14 bg-purple-500 hover:bg-purple-600 shadow-lg"
          size="icon"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  const chatContent = (
    <>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            AI Assistant
          </CardTitle>
          {isFloating && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onMinimize}>
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
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
    </>
  );

  if (isFloating) {
    return (
      <div className="fixed bottom-4 right-4 w-96 h-[600px] z-50 shadow-2xl">
        <Card className="h-full flex flex-col">
          {chatContent}
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Card className="h-full flex flex-col border-0 rounded-none">
        {chatContent}
      </Card>
    </div>
  );
};

export default AIChatInterface;
