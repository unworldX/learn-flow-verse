import React, { useState } from 'react';
import { Bot, MessageSquare, Lightbulb, BookOpen, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIStore } from '@/store/aiStore';
import { cn } from '@/lib/utils';

const AIAssistant: React.FC = () => {
  const { messages, isLoading, sendMessage } = useAIStore();
  const [aiInput, setAiInput] = useState('');
  
  const handleSend = async () => {
    if (!aiInput.trim() || isLoading) return;
    
    await sendMessage(aiInput);
    setAiInput('');
  };
  
  const handleQuickAction = async (action: string) => {
    const prompts = {
      summarize: 'Please summarize this note in 3-5 bullet points.',
      flashcards: 'Generate flashcards from the key concepts in this note.',
      improve: 'Suggest improvements to make this note clearer and more organized.',
    };
    
    await sendMessage(prompts[action as keyof typeof prompts]);
  };
  
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          AI Assistant
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ask questions, summarize, or generate content
        </p>
        
        <div className="flex gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => handleQuickAction('summarize')}
            disabled={isLoading}
          >
            <Lightbulb className="w-3 h-3 mr-1" />
            Summarize
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => handleQuickAction('flashcards')}
            disabled={isLoading}
          >
            <BookOpen className="w-3 h-3 mr-1" />
            Flashcards
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => handleQuickAction('improve')}
            disabled={isLoading}
          >
            <Zap className="w-3 h-3 mr-1" />
            Improve
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg p-3 max-w-[80%]",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="rounded-lg p-3 bg-muted">
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Ask AI anything..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} size="sm" disabled={isLoading}>
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
