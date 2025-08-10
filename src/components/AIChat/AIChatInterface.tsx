
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, Upload, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useAIChatMessages } from '@/hooks/useAIChatMessages';
import { Link } from 'react-router-dom';
import WelcomeScreen from './WelcomeScreen';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { useToast } from '@/hooks/use-toast';

const AIChatInterface = () => {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading } = useAIChatMessages();
  const [input, setInput] = useState('');
  const [reasoning, setReasoning] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
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

    const message = input.trim();
    setInput('');

    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'txt') {
        try {
          const text = await file.text();
          await sendMessage(`Summarize this study file:\n\n${text.slice(0, 8000)}`, reasoning);
          toast({ title: 'Summarized', description: `${file.name} processed` });
        } catch (err) {
          toast({ title: 'Failed to read file', description: 'Please try again', variant: 'destructive' });
        }
      } else if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
        toast({
          title: 'PDF/DOC summarization',
          description: 'Server-side summarization will be added next. For now, upload .txt for instant summaries.',
        });
      } else {
        toast({ title: 'Unsupported file', description: 'Only .txt, .pdf, .doc, .docx are allowed', variant: 'destructive' });
      }
    }

    setFile(null);

    if (message) {
      await sendMessage(message, reasoning);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  if (!user) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-3 md:p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-0 rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <Bot className="w-12 h-12 md:w-16 md:h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-lg md:text-xl font-semibold mb-2 text-slate-800">AI Assistant</h2>
            <p className="text-sm md:text-base text-slate-600 mb-4">Please sign in to chat with your AI study assistant</p>
            <Link to="/login">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-3 md:p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-semibold text-slate-800">AI Assistant</h1>
              <p className="text-xs md:text-sm text-slate-600">Your study companion</p>
            </div>
          </div>
          <Link to="/settings" className="text-slate-600 hover:text-slate-800">
            <Settings className="w-5 h-5 md:w-6 md:h-6" />
          </Link>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-3 md:space-y-4">
            {messages.length === 0 ? (
              <WelcomeScreen onPromptClick={handleQuickPrompt} />
            ) : (
              messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))
            )}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-md border-t border-slate-200 p-3 md:p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Switch
                  id="reasoning"
                  checked={reasoning}
                  onCheckedChange={setReasoning}
                  className="scale-75 md:scale-100"
                />
                <label htmlFor="reasoning" className="text-slate-600 select-none">
                  Reasoning
                </label>
              </div>
              <label
                htmlFor="file-upload"
                className="flex items-center cursor-pointer hover:bg-slate-100 rounded-lg p-1 transition"
                title="Attach File"
              >
                <Upload className="w-4 h-4 text-blue-500" />
                <input
                  id="file-upload"
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    const ext = f.name.split('.').pop()?.toLowerCase();
                    const allowed = ['txt','pdf','doc','docx'];
                    if (!ext || !allowed.includes(ext)) {
                      toast({ title: 'Unsupported file', description: 'Only .txt, .pdf, .doc, .docx are allowed', variant: 'destructive' });
                      e.currentTarget.value = '';
                      return;
                    }
                    setFile(f);
                  }}
                  disabled={isLoading}
                />
              </label>
              {file && (
                <span className="text-xs text-slate-700 truncate max-w-24 md:max-w-none">{file.name}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                disabled={isLoading}
                className="h-10 md:h-12 border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl bg-white shadow-sm text-sm resize-none"
              />
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !file) || isLoading}
                className="h-10 md:h-12 px-3 md:px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs text-slate-500">
              Press Enter to send • Configure AI providers in Settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;
