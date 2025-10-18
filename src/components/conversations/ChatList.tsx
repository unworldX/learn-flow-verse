import { useMemo } from "react";
import { ChatSummary, Message } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pin, Search, Users, Edit, MessageCircle } from "lucide-react";

interface ChatListProps {
  chats: ChatSummary[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filter: "all" | "groups" | "unread";
  onFilterChange: (value: "all" | "groups" | "unread") => void;
  onTogglePin: (chatId: string) => void;
  onMute: (chatId: string, duration: "8h" | "1w" | "always" | "off") => void;
  onMarkUnread?: (chatId: string) => void;
  onArchive?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onCreateGroup: () => void;
  onJoinGroup?: () => void;
  onStartDM?: () => void;
  typingIndicators: Record<string, string[]>;
  searchMatches: { chatId: string; message: Message }[];
}

const formatPreview = (message: Message | undefined) => {
  if (!message) return "No messages yet";
  if (message.kind === "system") return message.body;
  if (message.attachments && message.attachments.length) {
    const types = new Set(message.attachments.map((att) => att.type));
    if (types.has("image")) return "📷 Photo";
    if (types.has("gif")) return "🎞️ GIF";
    if (types.has("sticker")) return "Sticker";
    if (types.has("document")) return message.attachments[0].fileName ?? "Document";
    if (types.has("audio")) return "Audio clip";
    if (types.has("voice-note")) return "🎙️ Voice note";
  }
  return message.body || "Tap to open";
};

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function ChatList({
  chats,
  messages,
  activeChatId,
  onSelectChat,
  searchTerm,
  onSearchTermChange,
  filter,
  onFilterChange,
  onTogglePin,
  onMute,
  onMarkUnread,
  onArchive,
  onDeleteChat,
  onCreateGroup,
  onJoinGroup,
  onStartDM,
  typingIndicators,
  searchMatches,
}: ChatListProps) {
  const matchesByChat = useMemo(() => {
    return searchMatches.reduce<Record<string, number>>((acc, match) => {
      acc[match.chatId] = (acc[match.chatId] ?? 0) + 1;
      return acc;
    }, {});
  }, [searchMatches]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="h-8 w-full rounded-lg bg-muted/30 border-0 pl-8 pr-3 text-sm transition-all duration-200 focus:bg-muted/50"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
        </div>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={onCreateGroup}
          className="h-8 w-8 rounded-lg hover:bg-muted"
          title="Create group"
        >
          <Users className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost"
          className="h-8 w-8 rounded-lg hover:bg-muted"
          onClick={onStartDM}
          title="Start direct message"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/30">
        {(["all", "groups", "unread"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange(f)}
            className={cn(
              "h-7 rounded-md capitalize text-xs transition-all duration-200",
              filter === f 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted"
            )}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-1">
            {chats.map((chat) => {
              const chatMessages = messages[chat.id] ?? [];
              const lastMessage =
                chatMessages.find((msg) => msg.id === chat.lastMessageId) ?? chatMessages.at(-1);
              const isActive = chat.id === activeChatId;
              const typing = typingIndicators[chat.id];
              const matchCount = matchesByChat[chat.id] ?? 0;

              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-all duration-150 cursor-pointer",
                    "hover:bg-muted/50",
                    isActive 
                      ? "bg-muted" 
                      : "bg-transparent"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage src={chat.avatarUrl} alt={chat.title} />
                      <AvatarFallback className="bg-muted text-xs font-medium">
                        {chat.title.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {chat.type === "direct" && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "truncate text-sm font-medium",
                        isActive ? "text-foreground" : "text-foreground"
                      )}>
                        {chat.title}
                      </p>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(chat.lastActivityAt)}
                        </span>
                        {searchTerm && matchCount > 0 && (
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                            {matchCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {typing && typing.length
                        ? `${typing.join(", ")} typing...`
                        : formatPreview(lastMessage)}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <Badge className="h-4 min-w-[16px] justify-center rounded-full px-1 text-[10px] font-semibold">
                      {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                    </Badge>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted-foreground/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onSelect={() => onTogglePin(chat.id)}>
                        {chat.pinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onMarkUnread?.(chat.id)}>Mark Unread</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => onMute(chat.id, "always")}>
                        Mute
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onArchive?.(chat.id)}>Archive</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {chat.pinned && (
                    <Pin className="absolute right-1.5 top-1.5 h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}