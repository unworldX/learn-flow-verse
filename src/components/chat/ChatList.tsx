
import React from 'react';
import ChatListItem from './ChatListItem';
import GroupListItem from './GroupListItem';

type Props = {
  chats: any[];
  groups: any[];
  selectedChatId: string | null;
  filters: { showPinned: boolean, showUnread: boolean };
  onSelectChat: (id: string, type: "direct" | "group") => void;
  view: 'all' | 'direct' | 'group';
};
const ChatList: React.FC<Props> = ({
  chats,
  groups,
  selectedChatId,
  filters,
  onSelectChat,
  view,
}) => (
  <div>
    {view !== 'group' && chats.map(chat =>
      <ChatListItem
        key={chat.user.id}
        chat={chat}
        selected={selectedChatId === chat.user.id}
        filters={filters}
        onClick={() => onSelectChat(chat.user.id, 'direct')}
      />
    )}
    {view !== 'direct' && groups.map(group =>
      <GroupListItem
        key={group.id}
        group={group}
        selected={selectedChatId === group.id}
        filters={filters}
        onClick={() => onSelectChat(group.id, 'group')}
      />
    )}
  </div>
);
export default ChatList;
