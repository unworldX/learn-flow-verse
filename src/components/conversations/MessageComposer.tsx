import { useEffect, useState, useRef } from "react";
import { Attachment, Message, UserProfile } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Image as ImageIcon,
  Laugh,
  Mic,
  Paperclip,
  Send,
  Sticker,
  BarChart3,
  X,
  Video,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadChatFile } from "@/lib/chatFileUpload";
import { useToast } from "@/hooks/use-toast";

interface MessageComposerProps {
  participants: UserProfile[];
  onSendText: (text: string) => void;
  onSendMedia: (attachments: Attachment[], caption?: string) => void;
  onSendSticker: (url: string) => void;
  onSendGif: (url: string) => void;
  onSendVoice: (durationSeconds: number) => void;
  onCreatePoll: () => void;
  onTyping: () => void;
  replyTo?: Message | null;
  onCancelReply: () => void;
  editingMessage?: Message | null;
  onSaveEdit: (text: string) => void;
  conversationId?: string;
}

const emojiPalette = ["😀", "😂", "😍", "🤔", "🙌", "🔥", "🎉", "👍"];

export function MessageComposer({
  participants,
  onSendText,
  onSendMedia,
  onSendSticker,
  onSendVoice,
  onCreatePoll,
  onTyping,
  replyTo,
  onCancelReply,
  editingMessage,
  onSaveEdit,
  conversationId,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.body);
    } else {
      setText("");
    }
  }, [editingMessage]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (editingMessage) {
      onSaveEdit(trimmed);
    } else {
      onSendText(trimmed);
    }
    setText("");
  };

  const handleAddEmoji = (emoji: string) => {
    setText((prev) => `${prev}${emoji}`);
    onTyping();
  };

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video' | 'file') => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const file = files[0];
      setUploadingFileName(file.name);
      
      const uploaded = await uploadChatFile(file, (progress) => {
        setUploadProgress(progress);
      });
      
      onSendMedia([{
        id: crypto.randomUUID(),
        type: uploaded.type,
        url: uploaded.url,
        thumbnailUrl: uploaded.thumbnailUrl,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
      }], text || undefined);
      
      setText("");
      toast({
        title: "Shared successfully",
        description: `${file.name} has been shared`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFileName("");
    }
  };

  const showMic = text.trim().length === 0 && !editingMessage;
  const recipientName = participants.find(p => !p.isOnline)?.name ?? participants[0]?.name ?? "the chat";

  return (
    <div className="shrink-0 border-t border-border/40 bg-background p-2.5">
      {isUploading && (
        <div className="mb-2 rounded-lg bg-muted/50 border border-border/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium">Uploading {uploadingFileName}...</p>
            <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 border border-border/50 p-2 text-sm">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs">
              Replying to {participants.find((p) => p.id === replyTo.senderId)?.name ?? "Unknown"}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {replyTo.body || "Attachment"}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onCancelReply} className="h-6 w-6 rounded-md hover:bg-muted">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {editingMessage && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-2 text-sm">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs text-yellow-600 dark:text-yellow-500">Editing Message</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{editingMessage.body}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onCancelReply} className="h-6 text-xs rounded-md hover:bg-muted">
            Cancel
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 shrink-0 rounded-lg hover:bg-muted"
            >
              <Laugh className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2">
            <div className="grid grid-cols-4 gap-1.5">
              {emojiPalette.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="text-xl hover:scale-110 transition-transform rounded-md p-1 hover:bg-muted/50"
                  onClick={() => handleAddEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files, 'image')}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files, 'video')}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files, 'file')}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 shrink-0 rounded-lg hover:bg-muted"
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2">
            <div className="grid grid-cols-2 gap-1.5">
              <Button 
                variant="outline" 
                className="flex h-auto flex-col gap-1.5 p-3 hover:bg-muted" 
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImageIcon className="h-5 w-5" />
                <span className="text-[10px] font-medium">Image</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex h-auto flex-col gap-1.5 p-3 hover:bg-muted" 
                onClick={() => videoInputRef.current?.click()}
                disabled={isUploading}
              >
                <Video className="h-5 w-5" />
                <span className="text-[10px] font-medium">Video</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex h-auto flex-col gap-1.5 p-3 hover:bg-muted" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <FileText className="h-5 w-5" />
                <span className="text-[10px] font-medium">Doc</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex h-auto flex-col gap-1.5 p-3 hover:bg-muted" 
                onClick={() => onSendSticker('https://media.tenor.com/2roX3uxz_68AAAAC/cat-computer.gif')}
                disabled={isUploading}
              >
                <Sticker className="h-5 w-5" />
                <span className="text-[10px] font-medium">Sticker</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex h-auto flex-col gap-1.5 p-3 hover:bg-muted col-span-2" 
                onClick={onCreatePoll}
                disabled={isUploading}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-[10px] font-medium">Poll</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="relative w-full">
          <Input
            placeholder={editingMessage ? "Edit message..." : `Message`}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="h-8 rounded-lg pl-3 pr-3 text-sm bg-muted/30 border-0 focus:bg-muted/50"
          />
        </div>

        <Button
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg"
          onClick={showMic ? () => onSendVoice(30) : handleSend}
          disabled={!showMic && !text.trim()}
        >
          {showMic ? <Mic className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}