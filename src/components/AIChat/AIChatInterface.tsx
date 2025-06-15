import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, Brain, BookOpen, Calculator, Lightbulb, Zap, Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useAIChatMessages } from '@/hooks/useAIChatMessages';

const AIChatInterface = () => {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading } = useAIChatMessages();
  const [input, setInput] = useState('');
  const [reasoning, setReasoning] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !file) return;

    // Only implement message sending; file logic is left as a TODO.
    const message = input.trim();
    setInput('');
    setFile(null);

    // If file exists, display a toast
    if (file) {
      // TODO: handle file sending here
      alert(`Selected file: ${file.name}. File upload logic not implemented.`);
    }

    if (message) {
      await sendMessage(message); // Fixed: removed second argument
    }
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
      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-8 md:py-16">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl">
                  <Bot className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-slate-800 mb-2 md:mb-3">
                  Welcome to your AI Study Assistant!
                </h3>
                <p className="text-slate-600 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base px-4">
                  I'm here to help you learn, solve problems, and achieve your academic goals. Ask me anything!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto px-4">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className="p-3 md:p-4 h-auto text-left border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl md:rounded-2xl transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 ${prompt.color} rounded-lg md:rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                          <prompt.icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <span className="font-medium text-slate-800 text-sm md:text-base">{prompt.text}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex gap-2 md:gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'ai' && (
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow-lg flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <Bot className="w-4 h-4 md:w-5 md:h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[85%] md:max-w-[70%] ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                      : 'bg-white border border-slate-200 shadow-lg'
                  } rounded-xl md:rounded-2xl p-3 md:p-6`}>
                    <div className={`prose max-w-none ${message.type === 'user' ? 'prose-invert' : ''}`}>
                      <p className="mb-0 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <div className={`text-xs mt-2 md:mt-3 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {message.type === 'user' && (
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow-lg flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                        <User className="w-4 h-4 md:w-5 md:h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-2 md:gap-4 justify-start">
                <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Bot className="w-4 h-4 md:w-5 md:h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-slate-200 shadow-lg rounded-xl md:rounded-2xl p-4 md:p-6 max-w-[70%]">
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
      <div className="bg-white/80 backdrop-blur-md border-t border-slate-200 p-3 md:p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-3">
            <div className="flex-1 relative flex flex-col md:flex-row gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                disabled={isLoading}
                className="pr-16 h-10 md:h-12 lg:h-14 border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl md:rounded-2xl bg-white shadow-sm text-sm md:text-base resize-none"
              />
              <div className="flex items-center gap-1">
                <Switch
                  id="reasoning"
                  checked={reasoning}
                  onCheckedChange={setReasoning}
                  className="mr-2"
                />
                <label htmlFor="reasoning" className="text-xs text-slate-600 select-none mr-3">
                  Reasoning
                </label>
                <label
                  htmlFor="file-upload"
                  className="flex items-center cursor-pointer hover:bg-slate-100 rounded-lg p-1 transition"
                  title="Attach File"
                >
                  <Upload className="w-5 h-5 text-blue-500" />
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
                    }}
                    disabled={isLoading}
                  />
                </label>
                {file && (
                  <span className="ml-1 text-xs text-slate-700">{file.name}</span>
                )}
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !file) || isLoading}
              className="h-10 md:h-12 lg:h-14 px-4 md:px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl md:rounded-2xl"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
          <div className="mt-2 md:mt-3 text-center">
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
