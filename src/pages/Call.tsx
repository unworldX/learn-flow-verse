import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { webrtcService, CallStatus } from "@/lib/webrtc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Call() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const roomId = searchParams.get("room");
  const callType = (searchParams.get("type") as "voice" | "video") || "voice";

  const [status, setStatus] = useState<CallStatus>("idle");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(callType === "video");
  const [participants, setParticipants] = useState<any[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Initialize call
  useEffect(() => {
    if (!roomId || !user?.id) {
      toast({
        title: "Error",
        description: "Invalid call parameters",
        variant: "destructive",
      });
      navigate("/conversations");
      return;
    }

    const startCall = async () => {
      try {
        await webrtcService.startCall(
          roomId,
          user.id,
          callType,
          setStatus,
          setParticipants
        );

        // Setup local video
        const localStream = webrtcService.getCurrentStream();
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (error) {
        console.error("[Call] Failed to start call:", error);
        toast({
          title: "Call Failed",
          description: "Could not start the call. Please check your permissions.",
          variant: "destructive",
        });
        navigate("/conversations");
      }
    };

    startCall();

    return () => {
      webrtcService.endCall();
    };
  }, [roomId, user?.id, callType, navigate, toast]);

  // Update remote videos
  useEffect(() => {
    participants.forEach((participant) => {
      const videoElement = remoteVideosRef.current.get(participant.userId);
      if (videoElement && participant.stream) {
        videoElement.srcObject = participant.stream;
      }
    });
  }, [participants]);

  const handleToggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    webrtcService.toggleAudio(newState);
  };

  const handleToggleVideo = () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    webrtcService.toggleVideo(newState);
  };

  const handleEndCall = async () => {
    await webrtcService.endCall();
    navigate("/conversations");
  };

  const isVideoCall = callType === "video";
  const showVideo = isVideoCall && videoEnabled;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
      {/* Status */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <Card className="px-6 py-3 bg-background/80 backdrop-blur-sm border-primary/20">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              status === "connecting" && "bg-yellow-500",
              status === "connected" && "bg-green-500",
              status === "ended" && "bg-red-500"
            )} />
            <span className="text-sm font-medium capitalize">{status}</span>
            {participants.length > 0 && (
              <>
                <div className="w-px h-4 bg-border mx-2" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {participants.length + 1} participants
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Video Grid */}
      <div className="flex-1 w-full max-w-7xl grid gap-4 p-4">
        {/* Local Video */}
        <Card className={cn(
          "relative overflow-hidden bg-gray-950 border-primary/20",
          participants.length === 0 ? "col-span-full" : "aspect-video"
        )}>
          {showVideo ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-4xl">
                  {user?.user_metadata?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <p className="text-xl font-medium">You</p>
            </div>
          )}
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm">
            You
          </div>
        </Card>

        {/* Remote Videos */}
        {participants.map((participant) => (
          <Card
            key={participant.userId}
            className="relative overflow-hidden bg-gray-950 border-primary/20 aspect-video"
          >
            <video
              ref={(el) => {
                if (el) remoteVideosRef.current.set(participant.userId, el);
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm">
              Participant {participant.userId.slice(0, 6)}
            </div>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Card className="px-6 py-4 bg-background/90 backdrop-blur-sm border-primary/20">
          <div className="flex items-center gap-3">
            {/* Microphone */}
            <Button
              size="icon"
              variant={audioEnabled ? "secondary" : "destructive"}
              className="h-12 w-12 rounded-full"
              onClick={handleToggleAudio}
            >
              {audioEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>

            {/* Video (only for video calls) */}
            {isVideoCall && (
              <Button
                size="icon"
                variant={videoEnabled ? "secondary" : "destructive"}
                className="h-12 w-12 rounded-full"
                onClick={handleToggleVideo}
              >
                {videoEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Screen Share (disabled for now) */}
            <Button
              size="icon"
              variant="secondary"
              className="h-12 w-12 rounded-full"
              disabled
            >
              <MonitorUp className="h-5 w-5" />
            </Button>

            {/* End Call */}
            <Button
              size="icon"
              variant="destructive"
              className="h-14 w-14 rounded-full ml-4"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
