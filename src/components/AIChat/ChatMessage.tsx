
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { AIMessage } from '@/types/ai';

interface ChatMessageProps {
  message: AIMessage;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div className={`flex gap-2 md:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'ai' && (
        <Avatar className="w-6 h-6 md:w-8 md:h-8 border-2 border-white shadow-lg flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Bot className="w-3 h-3 md:w-4 md:h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[90%] md:max-w-[75%] ${
        message.type === 'user' 
          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
          : 'bg-white border border-slate-200 shadow-lg'
      } rounded-xl p-3 md:p-4`}>
        <div className={`prose max-w-none ${message.type === 'user' ? 'prose-invert' : ''}`}>
          <p className="mb-0 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <div className={`text-xs mt-1 md:mt-2 ${
          message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
        }`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {message.type === 'user' && (
        <Avatar className="w-6 h-6 md:w-8 md:h-8 border-2 border-white shadow-lg flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
            <User className="w-3 h-3 md:w-4 md:h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
