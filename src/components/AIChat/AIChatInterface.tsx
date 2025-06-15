

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Settings, 
  User, 
  Bot, 
  Copy, 
  RotateCcw, 
  Trash2, 
  MessageSquare,
  Sparkles,
  Zap,
  Brain,
  Cpu
} from "lucide-react";
import AISettings from './AISettings';

// AI Provider configurations
const AI_PROVIDERS = {
  'OpenRouter': {
    name: 'OpenRouter',
    icon: Zap,
    models: [
      { id: 'openrouter/auto', name: 'Auto (Best Available)', free: false },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', free: false },
      { id: 'openai/gpt-4o', name: 'GPT-4o', free: false },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', free: false },
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', free: false }
    ]
  },
  'OpenAI': {
    name: 'OpenAI',
    icon: Brain,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', free: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', free: true },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', free: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', free: true }
    ]
  },
  'Google': {
    name: 'Google',
    icon: Sparkles,
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', free: false },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', free: false },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', free: true }
    ]
  },
  'Other': {
    name: 'Other Providers',
    icon: Cpu,
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', free: false },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', free: false },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', free: true },
      { id: 'mistral-large', name: 'Mistral Large', free: false }
    ]
  }
};

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const AIChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI study assistant. How can I help you with your learning today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('OpenRouter');
  const [selectedModel, setSelectedModel] = useState('openrouter/auto');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about: "${userMessage.content}". I'm here to help with your studies! This is a simulated response using ${selectedModel} from ${selectedProvider}.`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      content: 'Hello! I\'m your AI study assistant. How can I help you with your learning today?',
      role: 'assistant',
      timestamp: new Date()
    }]);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Get available models based on selected provider
  const currentProvider = AI_PROVIDERS[selectedProvider as keyof typeof AI_PROVIDERS];
  const availableModels = currentProvider?.models || [];

  // Update selected model when provider changes
  useEffect(() => {
    if (currentProvider && availableModels.length > 0) {
      setSelectedModel(availableModels[0].id);
    }
  }, [selectedProvider, currentProvider, availableModels]);

  const ProviderIcon = currentProvider?.icon || Brain;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Main Chat Panel */}
        <ResizablePanel defaultSize={75} minSize={60}>
          <div className="h-full flex flex-col">
            {/* Enhanced Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
                        <p className="text-sm text-gray-500">Powered by {currentProvider?.name}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                      <ProviderIcon className="w-3 h-3 mr-1" />
                      {selectedModel.split('/').pop()?.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearChat}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>

                {/* Model Selection Bar */}
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Provider:</label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger className="w-40 h-9 bg-white border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <provider.icon className="w-4 h-4" />
                              {provider.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Model:</label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="w-56 h-9 bg-white border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">
                            {currentProvider?.name || selectedProvider} Models
                          </SelectLabel>
                          {availableModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                  <span className="font-medium">{model.name}</span>
                                  {model.free && <span className="text-xs text-green-600">Free</span>}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Messages Area */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={`group max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-md'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-tl-md shadow-sm'
                      } px-4 py-3`}
                    >
                      <div className="prose prose-sm max-w-none">
                        <p className="mb-0 leading-relaxed">{message.content}</p>
                      </div>
                      
                      <div className={`flex items-center justify-between mt-2 pt-2 border-t ${
                        message.role === 'user' 
                          ? 'border-white/20' 
                          : 'border-gray-100'
                      }`}>
                        <span className={`text-xs ${
                          message.role === 'user' 
                            ? 'text-white/70' 
                            : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 ${
                            message.role === 'user'
                              ? 'text-white/70 hover:text-white hover:bg-white/10'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Enhanced Input Area */}
            <div className="bg-white border-t border-gray-200 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your studies..."
                    className="min-h-[60px] max-h-32 resize-none pr-16 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-xl"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="absolute bottom-2 right-2 h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    <Badge variant="outline" className="text-xs">
                      {messages.length - 1} messages
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        {showSettings && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <Card className="h-full rounded-none border-l border-gray-200 shadow-none">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <AISettings />
                </CardContent>
              </Card>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default AIChatInterface;

