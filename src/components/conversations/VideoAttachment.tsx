import { useState } from "react";
import { Attachment } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Play } from "lucide-react";

interface VideoAttachmentProps {
  attachment: Attachment;
  caption?: string;
}

export function VideoAttachment({ attachment, caption }: VideoAttachmentProps) {
  const [showFull, setShowFull] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const hasThumb = !!attachment.thumbnailUrl;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName || 'video';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!showFull && hasThumb) {
    return (
      <div className="relative">
        <div className="relative">
          <img 
            src={attachment.thumbnailUrl} 
            alt="Video thumbnail" 
            className="max-w-full max-h-[300px] object-cover rounded-t-xl"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-xl">
            <Button
              size="icon"
              className="h-16 w-16 rounded-full shadow-lg"
              onClick={() => setShowFull(true)}
            >
              <Play className="h-8 w-8" />
            </Button>
          </div>
        </div>
        {caption && (
          <div className="px-3 py-2 bg-background/95">
            <p className="text-sm leading-snug">{caption}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative group/video">
      <video 
        src={attachment.url} 
        controls 
        className="max-w-full max-h-[300px] rounded-t-xl"
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover/video:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full shadow-lg"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </div>
      {caption && (
        <div className="px-3 py-2 bg-background/95">
          <p className="text-sm leading-snug">{caption}</p>
        </div>
      )}
    </div>
  );
}
