/**
 * WebRTC Service for Voice & Video Calls
 * Supports 1:1 and group calls
 */

import { supabase } from "@/integrations/supabase/client";

export type CallType = "voice" | "video";
export type CallStatus = "idle" | "connecting" | "connected" | "ended";

interface CallParticipant {
  userId: string;
  stream?: MediaStream;
  connection?: RTCPeerConnection;
}

interface CallConfig {
  iceServers: RTCIceServer[];
}

const DEFAULT_CONFIG: CallConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export class WebRTCService {
  private localStream: MediaStream | null = null;
  private participants: Map<string, CallParticipant> = new Map();
  private callType: CallType = "voice";
  private status: CallStatus = "idle";
  private roomId: string | null = null;
  private currentUserId: string | null = null;
  private statusCallback?: (status: CallStatus) => void;
  private participantCallback?: (participants: CallParticipant[]) => void;

  async startCall(
    roomId: string,
    userId: string,
    type: CallType,
    onStatusChange?: (status: CallStatus) => void,
    onParticipantsChange?: (participants: CallParticipant[]) => void
  ): Promise<void> {
    this.roomId = roomId;
    this.currentUserId = userId;
    this.callType = type;
    this.statusCallback = onStatusChange;
    this.participantCallback = onParticipantsChange;

    this.setStatus("connecting");

    try {
      // Get local media stream
      this.localStream = await this.getUserMedia(type);

      // Setup signaling channel
      await this.setupSignaling();

      // Send join signal
      await this.sendSignal("join", { userId, type });

      this.setStatus("connected");
    } catch (error) {
      console.error("[WebRTC] Failed to start call:", error);
      this.setStatus("ended");
      throw error;
    }
  }

  async endCall(): Promise<void> {
    // Send leave signal
    if (this.roomId && this.currentUserId) {
      await this.sendSignal("leave", { userId: this.currentUserId });
    }

    // Close all peer connections
    this.participants.forEach((participant) => {
      participant.connection?.close();
    });

    // Stop local stream
    this.localStream?.getTracks().forEach((track) => track.stop());

    // Cleanup
    this.localStream = null;
    this.participants.clear();
    this.roomId = null;
    this.setStatus("ended");
  }

  toggleAudio(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  toggleVideo(enabled: boolean): void {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  getCurrentStream(): MediaStream | null {
    return this.localStream;
  }

  getParticipants(): CallParticipant[] {
    return Array.from(this.participants.values());
  }

  getStatus(): CallStatus {
    return this.status;
  }

  private async getUserMedia(type: CallType): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: type === "video" ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      } : false,
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  private async setupSignaling(): Promise<void> {
    if (!this.roomId) return;

    // Subscribe to signaling channel
    const channel = supabase.channel(`call:${this.roomId}`);

    channel
      .on("broadcast", { event: "signal" }, async (payload) => {
        await this.handleSignal(payload.payload);
      })
      .subscribe();
  }

  private async sendSignal(type: string, data: any): Promise<void> {
    if (!this.roomId) return;

    const channel = supabase.channel(`call:${this.roomId}`);
    await channel.send({
      type: "broadcast",
      event: "signal",
      payload: { type, data, from: this.currentUserId },
    });
  }

  private async handleSignal(signal: any): Promise<void> {
    const { type, data, from } = signal;

    if (from === this.currentUserId) return;

    switch (type) {
      case "join":
        await this.handleJoin(from, data);
        break;
      case "offer":
        await this.handleOffer(from, data);
        break;
      case "answer":
        await this.handleAnswer(from, data);
        break;
      case "ice-candidate":
        await this.handleIceCandidate(from, data);
        break;
      case "leave":
        await this.handleLeave(from);
        break;
    }
  }

  private async handleJoin(userId: string, data: any): Promise<void> {
    // Create peer connection for new participant
    const peerConnection = new RTCPeerConnection(DEFAULT_CONFIG);

    // Add local stream tracks
    this.localStream?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, this.localStream!);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal("ice-candidate", {
          candidate: event.candidate,
          to: userId,
        });
      }
    };

    // Handle remote stream
    const remoteStream = new MediaStream();
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send offer
    await this.sendSignal("offer", { offer, to: userId });

    // Store participant
    this.participants.set(userId, {
      userId,
      connection: peerConnection,
      stream: remoteStream,
    });

    this.notifyParticipants();
  }

  private async handleOffer(userId: string, data: any): Promise<void> {
    const peerConnection = new RTCPeerConnection(DEFAULT_CONFIG);

    // Add local stream tracks
    this.localStream?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, this.localStream!);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal("ice-candidate", {
          candidate: event.candidate,
          to: userId,
        });
      }
    };

    // Handle remote stream
    const remoteStream = new MediaStream();
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    // Set remote description
    await peerConnection.setRemoteDescription(data.offer);

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send answer
    await this.sendSignal("answer", { answer, to: userId });

    // Store participant
    this.participants.set(userId, {
      userId,
      connection: peerConnection,
      stream: remoteStream,
    });

    this.notifyParticipants();
  }

  private async handleAnswer(userId: string, data: any): Promise<void> {
    const participant = this.participants.get(userId);
    if (participant?.connection) {
      await participant.connection.setRemoteDescription(data.answer);
    }
  }

  private async handleIceCandidate(userId: string, data: any): Promise<void> {
    const participant = this.participants.get(userId);
    if (participant?.connection) {
      await participant.connection.addIceCandidate(data.candidate);
    }
  }

  private async handleLeave(userId: string): Promise<void> {
    const participant = this.participants.get(userId);
    if (participant) {
      participant.connection?.close();
      this.participants.delete(userId);
      this.notifyParticipants();
    }
  }

  private setStatus(status: CallStatus): void {
    this.status = status;
    this.statusCallback?.(status);
  }

  private notifyParticipants(): void {
    this.participantCallback?.(this.getParticipants());
  }
}

// Export singleton
export const webrtcService = new WebRTCService();
