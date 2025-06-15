
import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
type Props = {
  chat: any;
  selected: boolean;
  filters: { showPinned: boolean, showUnread: boolean };
  onClick: () => void;
};
const ChatListItem: React.FC<Props> = ({ chat, selected, filters, onClick }) => (
  <div
    className={`flex items-center gap-2 p-3 cursor-pointer border-b ${selected ? 'bg-blue-50 border-l-4 border-l-blue-500':'hover:bg-gray-50'}`}
    onClick={onClick}
  >
    <Avatar className="w-10 h-10">
      <AvatarFallback>{chat.user.full_name?.[0] || chat.user.email[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium truncate">{chat.user.full_name || chat.user.email}</span>
        {chat.unreadCount > 0 && (
          <Badge className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full ml-2">
            {chat.unreadCount}
          </Badge>
        )}
      </div>
      <span className="text-xs text-gray-500 truncate">
        {chat.lastMessage?.decrypted_content?.slice(0, 18) || chat.lastMessage?.file_name || chat.lastMessage?.message_type}
      </span>
    </div>
    {chat.isPinned && <span className="text-yellow-500 ml-2">★</span>}
    {chat.isOnline && <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>}
  </div>
);
export default ChatListItem;
