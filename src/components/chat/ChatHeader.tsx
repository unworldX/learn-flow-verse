
import React from 'react';
import { Button } from "@/components/ui/button";
import { Phone, VideoIcon, MoreVertical, ArrowLeft } from 'lucide-react';
const ChatHeader = ({ title, subtitle, avatar, isGroup, onBack }: {
  title: string,
  subtitle?: string,
  avatar?: React.ReactNode,
  isGroup: boolean,
  onBack?: () => void
}) => (
  <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3 flex-1">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      {avatar}
      <div>
        <h3 className="font-semibold truncate">{title}</h3>
        {subtitle && <p className="text-sm text-green-500">{subtitle}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon">
        <Phone className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <VideoIcon className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  </div>
);
export default ChatHeader;
