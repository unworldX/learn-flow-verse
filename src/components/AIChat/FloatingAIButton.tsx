
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import AIChatInterface from './AIChatInterface';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

const FloatingAIButton = () => {
  const { isOpen, isMinimized, openChat, closeChat, minimizeChat, maximizeChat } = useAIChat();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleChatAction = () => {
    if (isMobile) {
      navigate('/ai-chat');
    } else {
      openChat();
    }
  };

  if (isMobile) {
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
  }

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={openChat}
            className="rounded-full w-14 h-14 bg-purple-500 hover:bg-purple-600 shadow-lg"
            size="icon"
          >
            <Bot className="w-6 h-6" />
          </Button>
        </div>
      )}
      
      {isOpen && (
        <AIChatInterface
          isFloating={true}
          onClose={closeChat}
          onMinimize={minimizeChat}
          onMaximize={maximizeChat}
          isMinimized={isMinimized}
        />
      )}
    </>
  );
};

export default FloatingAIButton;
