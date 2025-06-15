
import React from 'react';
import { Badge } from "@/components/ui/badge";
type Props = {
  group: any;
  selected: boolean;
  filters: { showPinned: boolean; showUnread: boolean };
  onClick: () => void;
};
const GroupListItem: React.FC<Props> = ({ group, selected, filters, onClick }) => (
  <div className={`p-3 cursor-pointer flex items-center border-b ${selected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
    onClick={onClick}>
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-lg font-bold">
      {group.name?.[0]}
    </div>
    <div className="flex-1 min-w-0 ml-3">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium truncate">{group.name}</span>
        {group.unreadCount > 0 && (
          <Badge className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full ml-2">
            {group.unreadCount}
          </Badge>
        )}
      </div>
      <span className="text-xs text-gray-500 truncate">
        {group.lastMessagePreview}
      </span>
    </div>
    {group.isPinned && <span className="text-yellow-500 ml-2">★</span>}
  </div>
);
export default GroupListItem;
