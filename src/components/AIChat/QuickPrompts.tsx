
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, BookOpen, Lightbulb, Brain } from 'lucide-react';

interface QuickPromptsProps {
  onPromptClick: (prompt: string) => void;
}

const quickPrompts = [
  { icon: Calculator, text: "Help me solve this math problem", color: "bg-blue-500" },
  { icon: BookOpen, text: "Explain this concept to me", color: "bg-green-500" },
  { icon: Lightbulb, text: "Give me study tips", color: "bg-yellow-500" },
  { icon: Brain, text: "Create a study plan", color: "bg-purple-500" }
];

const QuickPrompts = ({ onPromptClick }: QuickPromptsProps) => {
  return (
    <div className="grid grid-cols-1 gap-2 md:gap-3 max-w-lg mx-auto px-4">
      {quickPrompts.map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => onPromptClick(prompt.text)}
          className="p-2 md:p-3 h-auto text-left border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all duration-300 group"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`w-6 h-6 md:w-8 md:h-8 ${prompt.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
              <prompt.icon className="w-3 h-3 md:w-4 md:h-4" />
            </div>
            <span className="font-medium text-slate-800 text-xs md:text-sm">{prompt.text}</span>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default QuickPrompts;
