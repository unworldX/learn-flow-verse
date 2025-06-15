
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, Brain, BookOpen, Calculator, Lightbulb, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAIChat } from '@/hooks/useAIChat';

const AIChatInterface = () => {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading } = useAIChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    { icon: Calculator, text: "Help me solve this math problem", color: "bg-blue-500" },
    { icon: BookOpen, text: "Explain this concept to me", color: "bg-green-500" },
    { icon: Lightbulb, text: "Give me study tips", color: "bg-yellow-500" },
    { icon: Brain, text: "Create a study plan", color: "bg-purple-500" }
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  if (!user) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-0 rounded-2xl">
          <CardContent className="p-8">
            <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-slate-800">AI Assistant</h2>
            <p className="text-slate-600">Please sign in to chat with your AI study assistant</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:p-6 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Study Assistant
              </h1>
              <p className="text-slate-600 text-sm md:text-base">Your personal learning companion powered by AI</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-lg">
                <Zap className="w-3 h-3 mr-1" />
                Online
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-slate-800 mb-3">
                  Welcome to your AI Study Assistant!
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  I'm here to help you learn, solve problems, and achieve your academic goals. Ask me anything!
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className="p-4 h-auto text-left border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-2xl transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${prompt.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                          <prompt.icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-slate-800">{prompt.text}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'ai' && (
                    <Avatar className="w-10 h-10 border-2 border-white shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <Bot className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[80%] md:max-w-[70%] ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                      : 'bg-white border border-slate-200 shadow-lg'
                  } rounded-2xl p-4 md:p-6`}>
                    <div className={`prose max-w-none ${message.type === 'user' ? 'prose-invert' : ''}`}>
                      <p className="mb-0 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <div className={`text-xs mt-3 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <Avatar className="w-10 h-10 border-2 border-white shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="w-10 h-10 border-2 border-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-slate-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 md:p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                disabled={isLoading}
                className="pr-16 h-12 md:h-14 border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-400 rounded-2xl bg-white shadow-sm text-base resize-none"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-12 md:h-14 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500">
              Press Enter to send • Your AI assistant is here to help with studies, homework, and learning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;
