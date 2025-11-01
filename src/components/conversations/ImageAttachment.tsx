import { useState } from "react";
import { Attachment } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageAttachmentProps {
  attachment: Attachment;
  caption?: string;
}

export function ImageAttachment({ attachment, caption }: ImageAttachmentProps) {
  const [isFullLoaded, setIsFullLoaded] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const displayUrl = showFull ? attachment.url : (attachment.thumbnailUrl || attachment.url);
  const hasThumb = !!attachment.thumbnailUrl;

  const handleDownload = async () => {
    if (!showFull && hasThumb) {
      setShowFull(true);
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName || 'image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative group/image">
      {!isFullLoaded && hasThumb && showFull && (
        <Skeleton className="absolute inset-0 rounded-t-xl" />
      )}
      <img 
        src={displayUrl} 
        alt="Image" 
        className="max-w-full max-h-[300px] object-cover rounded-t-xl"
        onLoad={() => showFull && setIsFullLoaded(true)}
        style={{ opacity: (!isFullLoaded && hasThumb && showFull) ? 0 : 1 }}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
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
      {hasThumb && !showFull && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-t-xl">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFull(true)}
            className="shadow-lg"
          >
            Load Full Quality
          </Button>
        </div>
      )}
      {caption && (
        <div className="px-3 py-2 bg-background/95">
          <p className="text-sm leading-snug">{caption}</p>
        </div>
      )}
    </div>
  );
}
