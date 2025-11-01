import { useMemo } from "react";
import { Message, UserProfile } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  FileText,
  Download,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import { useState } from "react";

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
  onPinChange,
  onReact,
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

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (isDeletedForMe) return null;

  const hasAttachments = message.attachments && message.attachments.length > 0;
  const firstAttachment = hasAttachments ? message.attachments[0] : null;

  return (
    <div
      className={cn(
        "group flex w-full max-w-[75%] flex-col gap-0.5",
        isOwnMessage ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      <div
        className={cn(
          "relative flex flex-col rounded-xl overflow-hidden",
          hasAttachments && (firstAttachment?.type === 'image' || firstAttachment?.type === 'video' || firstAttachment?.type === 'sticker' || firstAttachment?.type === 'gif') 
            ? "px-0 py-0" 
            : "px-3 py-1.5",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {!isOwnMessage && (
          <div className={cn("mb-1 flex items-center gap-1.5", hasAttachments && (firstAttachment?.type === 'image' || firstAttachment?.type === 'video' || firstAttachment?.type === 'sticker' || firstAttachment?.type === 'gif') && "px-3 pt-2")}>
            <Avatar className="h-4 w-4">
              <AvatarImage src={sender?.avatarUrl} />
              <AvatarFallback className="text-[8px]">{(sender?.name ?? "").slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-primary">{sender?.name ?? "Unknown"}</span>
          </div>
        )}

        {replySnippet && (
          <div className={cn("mb-1 rounded-md bg-black/10 p-1.5 text-xs", hasAttachments && (firstAttachment?.type === 'image' || firstAttachment?.type === 'video' || firstAttachment?.type === 'sticker' || firstAttachment?.type === 'gif') && "mx-3")}>
            <p className="font-semibold text-[11px]">{replySnippet.author}</p>
            <p className="line-clamp-1 text-[11px]">{replySnippet.summary}</p>
          </div>
        )}

        {/* Attachments Rendering */}
        {hasAttachments && firstAttachment && (
          <div className="mb-1">
            {/* Image */}
            {firstAttachment.type === 'image' && (
              <div className="relative">
                <img 
                  src={firstAttachment.url} 
                  alt="Image" 
                  className="max-w-full max-h-[300px] object-cover rounded-t-xl"
                />
                {message.body && (
                  <div className="px-3 py-2 bg-background/95">
                    <p className="text-sm leading-snug">{message.body}</p>
                  </div>
                )}
              </div>
            )}

            {/* Video */}
            {firstAttachment.type === 'video' && (
              <div className="relative">
                <video 
                  src={firstAttachment.url} 
                  controls 
                  className="max-w-full max-h-[300px] rounded-t-xl"
                />
                {message.body && (
                  <div className="px-3 py-2 bg-background/95">
                    <p className="text-sm leading-snug">{message.body}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sticker/GIF */}
            {(firstAttachment.type === 'sticker' || firstAttachment.type === 'gif') && (
              <img 
                src={firstAttachment.url} 
                alt={firstAttachment.type} 
                className="max-w-[200px] max-h-[200px] object-contain"
              />
            )}

            {/* Audio */}
            {(firstAttachment.type === 'audio' || firstAttachment.type === 'voice-note') && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                >
                  {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <div className="flex-1">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/3" />
                  </div>
                  <p className="text-xs mt-1">
                    {firstAttachment.durationSeconds ? `${Math.floor(firstAttachment.durationSeconds / 60)}:${(firstAttachment.durationSeconds % 60).toString().padStart(2, '0')}` : '0:30'}
                  </p>
                </div>
                <Volume2 className="h-4 w-4" />
              </div>
            )}

            {/* Document */}
            {firstAttachment.type === 'document' && (
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {firstAttachment.fileName || 'Document'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {firstAttachment.fileSize || 'Unknown size'}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Text message body (if no media attachment or has caption) */}
        {message.body && !hasAttachments && (
          <p className="text-sm leading-snug">{message.body}</p>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", hasAttachments && (firstAttachment?.type === 'image' || firstAttachment?.type === 'video' || firstAttachment?.type === 'sticker' || firstAttachment?.type === 'gif') && "px-3 pb-2")}>
            {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
              const count = message.reactions!.filter(r => r.emoji === emoji).length;
              const hasReacted = message.reactions!.some(r => r.emoji === emoji && r.userId === currentUserId);
              return (
                <button 
                  key={emoji} 
                  onClick={() => onReact(message, emoji)}
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full transition-colors hover:bg-muted",
                    hasReacted ? "bg-primary/20 border border-primary/30" : "bg-background/80 border border-border/50"
                  )}
                >
                  {emoji} {count > 1 && count}
                </button>
              );
            })}
          </div>
        )}

        <div className={cn("mt-0.5 flex items-center self-end gap-1.5 text-[10px] opacity-70", hasAttachments && (firstAttachment?.type === 'image' || firstAttachment?.type === 'video' || firstAttachment?.type === 'sticker' || firstAttachment?.type === 'gif') && "px-3 pb-2")}>
          {message.editedAt && <span>edited</span>}
          <span>{formatTime(message.timeline.sentAt)}</span>
          {renderStatusIcon(message.status, isOwnMessage, readReceiptsEnabled)}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-md hover:bg-muted"
            >
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2">
            <div className="flex gap-1">
              {["❤️", "👍", "😂", "😮", "😢", "🙏"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message, emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-md hover:bg-muted"
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onDelete(message, "me")} className="text-destructive">
              <Trash className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}