
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile'; // Import mobile hook

const FloatingAIButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Only show on home, resources, and forums pages
  const allowedPaths = ['/', '/resources', '/forums'];
  const shouldShow = allowedPaths.includes(location.pathname);

  useEffect(() => {
    const savedPosition = localStorage.getItem('ai_button_position');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep button within viewport bounds
    const maxX = window.innerWidth - 56; // 56px is button width
    const maxY = window.innerHeight - 56; // 56px is button height

    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: boundedX, y: boundedY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem('ai_button_position', JSON.stringify(position));
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  const handleChatAction = () => {
    if (!isDragging) {
      navigate('/ai-chat');
    }
  };

  // Hide on mobile
  if (!shouldShow || isMobile) return null;

  return (
    <div
      ref={buttonRef}
      className="fixed z-50 cursor-move"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <Button
        onClick={handleChatAction}
        className="rounded-full w-14 h-14 bg-purple-500 hover:bg-purple-600 shadow-lg transition-all duration-200 hover:scale-105"
        size="icon"
      >
        <Bot className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default FloatingAIButton;
