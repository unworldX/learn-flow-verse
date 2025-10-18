import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Phone,
  Search,
  Video,
  PanelLeft,
} from "lucide-react";
import { ChatPreferences, ChatSummary, GroupMetadata, Message, UserProfile } from "@/types/chat";

interface ChatHeaderProps {
  chat: ChatSummary;
  participants: UserProfile[];
  onSearchChat: () => void;
  onStartCall: (type: "voice" | "video") => void;
  preferences: ChatPreferences;
  onToggleReadReceipts: () => void;
  onToggleMultiDevice: () => void;
  onExportChat: (includeMedia: boolean) => void;
  onTriggerBackup: () => void;
  onOpenInfo: () => void;
  onShareInvite: () => void;
  onShowQr: () => void;
  pinnedMessages: Message[];
  typingUsers: string[];
  groupMetadata?: GroupMetadata;
  variant?: "default" | "compact";
  onOpenSidebar?: () => void;
  onMute?: (duration?: string) => void;
  onClearHistory?: () => void;
  onDeleteChat?: () => void;
  onLeaveGroup?: () => void;
}

export function ChatHeader({
  chat,
  participants,
  onSearchChat,
  onStartCall,
  onOpenInfo,
  typingUsers,
  variant = "default",
  onOpenSidebar,
  onShareInvite,
  onShowQr,
  onMute,
  onClearHistory,
  onDeleteChat,
  onLeaveGroup,
}: ChatHeaderProps) {
  const onlineCount = useMemo(() => participants.filter((p) => p.isOnline).length, [participants]);
  const isGroup = chat.type === "group";

  const containerClasses = cn(
    "flex shrink-0 items-center justify-between border-b border-border/40 bg-background px-3 py-2"
  );

  const subtitle = useMemo(() => {
    if (typingUsers.length > 0) {
      return `typing...`;
    }
    if (isGroup) {
      return `${participants.length} members`;
    }
    const otherParticipant = participants.find(p => p.id !== "me");
    return otherParticipant?.isOnline ? "online" : "offline";
  }, [typingUsers, isGroup, participants]);


  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-2.5">
        {variant === "compact" && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onOpenSidebar} 
            title="Open chats list"
            className="h-8 w-8 rounded-lg hover:bg-muted"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        <button className="flex items-center gap-2.5 group transition-opacity hover:opacity-70" onClick={onOpenInfo}>
          <div className="relative">
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src={chat.avatarUrl} alt={chat.title} />
              <AvatarFallback className="bg-muted text-xs font-medium">
                {chat.title.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isGroup && (
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
            )}
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">{chat.title}</h2>
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onStartCall("voice")}
          title="Voice call"
          className="h-8 w-8 rounded-lg hover:bg-muted"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onStartCall("video")}
          title="Video call"
          className="h-8 w-8 rounded-lg hover:bg-muted"
        >
          <Video className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onSearchChat} 
          title="Search"
          className="h-8 w-8 rounded-lg hover:bg-muted"
        >
          <Search className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-muted"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={onOpenInfo}>{isGroup ? "Group info" : "Contact info"}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onMute?.("always")}>Mute notifications</DropdownMenuItem>
            {isGroup && (
              <>
                <DropdownMenuItem onSelect={onShareInvite}>Invite via link</DropdownMenuItem>
                <DropdownMenuItem onSelect={onShowQr}>Show QR code</DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onSelect={onClearHistory}>Clear history</DropdownMenuItem>
            {isGroup ? (
              <DropdownMenuItem className="text-destructive" onSelect={onLeaveGroup}>Leave group</DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-destructive" onSelect={onDeleteChat}>Delete chat</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}