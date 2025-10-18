import { useMemo } from "react";
import { Message, UserProfile } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCheck,
  MoreHorizontal,
  Smile,
  Paperclip,
  Mic,
  CornerDownRight,
  Star,
  Trash,
  Edit,
  Forward,
} from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  users: Record<string, UserProfile>;
  currentUserId: string;
  replyTo?: Message;
  linkPreview?: { title: string; description: string; image: string } | null;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onStar: (message: Message) => void;
  onDelete: (message: Message, scope: "me" | "everyone") => void;
  onEdit: (message: Message) => void;
  onPinChange: (message: Message, pinned: boolean) => void;
  onReact: (message: Message, emoji: string) => void;
  readReceiptsEnabled: boolean;
}

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const renderStatusIcon = (
  status: Message["status"],
  isOwn: boolean,
  readReceiptsEnabled: boolean
) => {
  if (!isOwn) return null;
  if (!readReceiptsEnabled && status === "read") {
    status = "delivered";
  }
  if (status === "sent") return <Check className="h-4 w-4 text-muted-foreground" />;
  if (status === "delivered") return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
  if (status === "read") return <CheckCheck className="h-4 w-4 text-blue-500" />;
  return null;
};

export function MessageBubble({
  message,
  isOwnMessage,
  users,
  currentUserId,
  replyTo,
  onReply,
  onForward,
  onStar,
  onDelete,
  onEdit,
  readReceiptsEnabled,
}: MessageBubbleProps) {
  const sender = users[message.senderId];
  const isDeletedForMe = message.isDeletedFor?.includes(currentUserId) || false;

  const replySnippet = useMemo(() => {
    if (!replyTo) return null;
    const author = users[replyTo.senderId]?.name ?? "Unknown";
    const summary = replyTo.body || "Media attachment";
    return { author, summary };
  }, [replyTo, users]);

  if (isDeletedForMe) return null;

  return (
    <div
      className={cn(
        "group flex w-full max-w-[75%] flex-col gap-0.5",
        isOwnMessage ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      <div
        className={cn(
          "relative flex flex-col rounded-xl px-3 py-1.5",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {!isOwnMessage && (
          <div className="mb-1 flex items-center gap-1.5">
            <Avatar className="h-4 w-4">
              <AvatarImage src={sender?.avatarUrl} />
              <AvatarFallback className="text-[8px]">{(sender?.name ?? "").slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-primary">{sender?.name ?? "Unknown"}</span>
          </div>
        )}

        {replySnippet && (
          <div className="mb-1 rounded-md bg-black/10 p-1.5 text-xs">
            <p className="font-semibold text-[11px]">{replySnippet.author}</p>
            <p className="line-clamp-1 text-[11px]">{replySnippet.summary}</p>
          </div>
        )}

        <p className="text-sm leading-snug">{message.body}</p>

        <div className="mt-0.5 flex items-center self-end gap-1.5 text-[10px] opacity-70">
          {message.editedAt && <span>edited</span>}
          <span>{formatTime(message.timeline.sentAt)}</span>
          {renderStatusIcon(message.status, isOwnMessage, readReceiptsEnabled)}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isOwnMessage ? "end" : "start"} className="w-36">
          <DropdownMenuItem onSelect={() => onReply(message)}>
            <CornerDownRight className="mr-2 h-3.5 w-3.5" /> Reply
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onForward(message)}>
            <Forward className="mr-2 h-3.5 w-3.5" /> Forward
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onStar(message)}>
            <Star className="mr-2 h-3.5 w-3.5" /> Star
          </DropdownMenuItem>
          {isOwnMessage && (
            <DropdownMenuItem onSelect={() => onEdit(message)}>
              <Edit className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => onDelete(message, "me")} className="text-destructive">
            <Trash className="mr-2 h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}