
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="flex gap-2 md:gap-3 justify-start">
      <Avatar className="w-6 h-6 md:w-8 md:h-8 border-2 border-white shadow-lg">
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <Bot className="w-3 h-3 md:w-4 md:h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl p-3 md:p-4 max-w-[70%]">
        <div className="flex items-center gap-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-xs md:text-sm text-slate-600">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
