import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  return (
    <div className="w-full">
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={videoUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </AspectRatio>
    </div>
  );
};

export default VideoPlayer;
