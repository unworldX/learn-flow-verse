export type ChatType = 'direct' | 'group';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export type AttachmentType =
  | 'image'
  | 'video'
  | 'document'
  | 'audio'
  | 'gif'
  | 'sticker'
  | 'voice-note';

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: string;
  durationSeconds?: number;
}

export interface ReactionEntry {
  emoji: string;
  userId: string;
  reactedAt: string;
}

export interface DeliveryTimeline {
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface MessageEditHistory {
  editedAt: string;
  previousBody: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string; // 'me' for the current user
  kind: 'text' | 'system' | 'media';
  body: string; // Maps to encrypted_content in DB
  encrypted_content?: string; // Raw DB field
  message_type?: string; // DB field for message type
  attachments?: Attachment[];
  status: MessageStatus;
  timeline: DeliveryTimeline;
  replyToId?: string;
  reply_to_message_id?: string; // Raw DB field
  forwardedFromChatId?: string;
  forwardedFromMessageId?: string;
  isDeletedFor?: string[];
  starredBy?: string[];
  reactions?: ReactionEntry[];
  editedAt?: string;
  editHistory?: MessageEditHistory[];
  isPinned?: boolean;
  replyTo?: {
    messageId: string;
    senderId: string;
    body: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  phoneNumber?: string;
  about?: string;
  isOnline?: boolean;
  lastSeen?: string;
  isBlocked?: boolean;
  role?: "admin" | "member";
}

export interface DisappearingSetting {
  mode: 'off' | '24h' | '7d' | '90d';
  lastUpdatedAt: string;
  updatedBy: string;
}

export interface ChatSummary {
  id: string;
  type: ChatType;
  title: string;
  subtitle?: string;
  avatarUrl: string;
  participants: string[];
  lastMessageId: string;
  unreadCount: number;
  pinned: boolean;
  archived?: boolean;
  mutedUntil?: string | null;
  description?: string;
  inviteLink?: string;
  starredMessageIds?: string[];
  lastActivityAt: string;
  disappearingSetting?: DisappearingSetting;
}

export interface ChatPreferences {
  readReceiptsEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  multiDeviceEnabled: boolean;
}

export interface GroupAdminSettings {
  admins: string[];
  sendPermission: 'everyone' | 'admins';
  editGroupInfoPermission: 'everyone' | 'admins';
}

export interface GroupMetadata {
  settings: GroupAdminSettings;
  inviteLink: string;
  createdAt: string;
  createdBy: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: string[];
}

export interface Poll {
  id: string;
  chatId: string;
  question: string;
  options: PollOption[];
  allowsMultiple: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CallRecord {
  id: string;
  chatId: string;
  type: 'voice' | 'video';
  startedAt: string;
  endedAt?: string;
  participants: string[];
  status: 'missed' | 'ended' | 'ongoing';
}

export interface ConversationSnapshot {
  chats: ChatSummary[];
  messages: Record<string, Message[]>;
  users: Record<string, UserProfile>;
  polls: Record<string, Poll>;
  calls: CallRecord[];
  preferences: ChatPreferences;
}
