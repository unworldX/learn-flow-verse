
import React from 'react';
import { Bot } from 'lucide-react';
import QuickPrompts from './QuickPrompts';

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

const WelcomeScreen = ({ onPromptClick }: WelcomeScreenProps) => {
  return (
    <div className="text-center py-6 md:py-12">
      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-xl">
        <Bot className="w-6 h-6 md:w-8 md:h-8 text-white" />
      </div>
      <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-2">
        Welcome to your AI Study Assistant!
      </h3>
      <p className="text-xs md:text-sm text-slate-600 mb-4 md:mb-6 max-w-md mx-auto px-4">
        I'm here to help you learn, solve problems, and achieve your academic goals. Ask me anything!
      </p>
      <QuickPrompts onPromptClick={onPromptClick} />
    </div>
  );
};

export default WelcomeScreen;
