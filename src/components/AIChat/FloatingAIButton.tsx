
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FloatingAIButton = () => {
  const navigate = useNavigate();

  const handleChatAction = () => {
    navigate('/ai-chat');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleChatAction}
        className="rounded-full w-14 h-14 bg-purple-500 hover:bg-purple-600 shadow-lg"
        size="icon"
      >
        <Bot className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default FloatingAIButton;
