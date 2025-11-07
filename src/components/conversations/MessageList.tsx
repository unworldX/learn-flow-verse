import { useEffect, useMemo, useRef } from "react";
import { Message, UserProfile } from "@/types/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageBubble } from "./MessageBubble";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useAuth } from "@/contexts/useAuth";

interface MessageListProps {
  messages: Message[];
  allMessages?: Message[];
  users: Record<string, UserProfile>;
  currentUserId: string;
  readReceiptsEnabled: boolean;
  linkPreviews: Record<string, { title: string; description: string; image: string }>;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onStar: (message: Message) => void;
  onDelete: (message: Message, scope: "me" | "everyone") => void;
  onEdit: (message: Message) => void;
  onPinChange: (message: Message, pinned: boolean) => void;
  onReact: (message: Message, emoji: string) => void;
  typingUsers: string[];
  conversationId?: string;
}

const dayKey = (iso?: string) => {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export function MessageList({
  messages,
  allMessages,
  users,
  currentUserId,
  readReceiptsEnabled,
  linkPreviews,
  onReply,
  onForward,
  onStar,
  onDelete,
  onEdit,
  onPinChange,
  onReact,
  typingUsers,
  conversationId,
}: MessageListProps) {
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId = messages.at(-1)?.id;
  
  // Real-time typing indicator
  const { typingUsers: realtimeTyping } = useTypingIndicator({
    channelKey: conversationId || '',
    currentUserId: user?.id,
    mode: conversationId?.startsWith('dm-') ? 'direct' : 'group'
  });

  const grouped = useMemo(() => {
    return messages.reduce<Record<string, Message[]>>((acc, message) => {
      const key = dayKey(message.timeline.sentAt);
      acc[key] = [...(acc[key] ?? []), message];
      return acc;
    }, {});
  }, [messages]);

  useEffect(() => {
    const node = scrollAreaRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [lastMessageId, messages.length]);

  return (
    <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
      <div className="space-y-6 p-4 md:p-6">
        {Object.entries(grouped).map(([label, dayMessages]) => (
          <div key={label} className="space-y-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Separator className="flex-1" />
              <span>{label}</span>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-2">
              {dayMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === currentUserId}
                  users={users}
                  currentUserId={currentUserId}
                  replyTo={(allMessages ?? messages).find((target) => target.id === message.replyToId)}
                  linkPreview={
                    message.body
                      ? Object.entries(linkPreviews).find(([url]) =>
                          message.body.includes(url)
                        )?.[1] ?? null
                      : null
                  }
                  onReply={onReply}
                  onForward={onForward}
                  onStar={onStar}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onPinChange={onPinChange}
                  onReact={onReact}
                  readReceiptsEnabled={readReceiptsEnabled}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Real-time typing indicator */}
        {realtimeTyping.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-xs text-muted-foreground italic">
              {realtimeTyping.map(u => users[u.id]?.name || 'Someone').join(', ')} typing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
