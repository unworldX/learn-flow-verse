// Extended database types for tables not in generated types
// This file provides type definitions for all tables used in the application

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string;
  message_type: 'text' | 'file' | 'image' | 'video' | 'audio';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  is_read: boolean;
  reply_to_message_id: string | null;
  deleted_by_sender: boolean;
  deleted_by_receiver: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  encrypted_content: string;
  message_type: 'text' | 'file' | 'image' | 'video' | 'audio';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  reply_to_message_id: string | null;
  deleted_at: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  invite_code: string | null;
  is_private: boolean;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface StudyGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface MutedChat {
  id: string;
  user_id: string;
  chat_type: 'direct' | 'group';
  chat_id: string;
  muted_until: string | null;
  created_at: string;
}

export interface ArchivedChat {
  id: string;
  user_id: string;
  chat_type: 'direct' | 'group';
  chat_id: string;
  archived_at: string;
}

export interface PinnedChat {
  id: string;
  user_id: string;
  chat_type: 'direct' | 'group';
  chat_id: string;
  pinned_at: string;
  order: number;
}

export interface UnreadOverride {
  id: string;
  user_id: string;
  chat_type: 'direct' | 'group';
  chat_id: string;
  force_unread: boolean;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface StarredMessage {
  id: string;
  user_id: string;
  message_id: string;
  message_type: 'direct' | 'group';
  starred_at: string;
}

export interface Poll {
  id: string;
  chat_id: string;
  chat_type: 'direct' | 'group';
  created_by: string;
  question: string;
  options: string[];
  multiple_answers: boolean;
  closes_at: string | null;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

export interface CallRecord {
  id: string;
  chat_id: string;
  chat_type: 'direct' | 'group';
  caller_id: string;
  call_type: 'voice' | 'video';
  duration: number | null;
  status: 'missed' | 'completed' | 'declined';
  started_at: string;
  ended_at: string | null;
}

export interface GroupSettings {
  id: string;
  group_id: string;
  allow_member_invites: boolean;
  allow_member_messages: boolean;
  only_admins_can_change_info: boolean;
  send_messages_permission: 'all' | 'admins' | 'admins_moderators';
  created_at: string;
  updated_at: string;
}

export interface DisappearingSetting {
  id: string;
  chat_id: string;
  chat_type: 'direct' | 'group';
  enabled: boolean;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

// Extend the Database type from Supabase
export interface ExtendedDatabase {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      direct_messages: {
        Row: DirectMessage;
        Insert: Omit<DirectMessage, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DirectMessage, 'id' | 'created_at' | 'updated_at'>>;
      };
      group_messages: {
        Row: GroupMessage;
        Insert: Omit<GroupMessage, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GroupMessage, 'id' | 'created_at' | 'updated_at'>>;
      };
      study_groups: {
        Row: StudyGroup;
        Insert: Omit<StudyGroup, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StudyGroup, 'id' | 'created_at' | 'updated_at'>>;
      };
      study_group_members: {
        Row: StudyGroupMember;
        Insert: Omit<StudyGroupMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<StudyGroupMember, 'id' | 'joined_at'>>;
      };
      message_reads: {
        Row: MessageRead;
        Insert: Omit<MessageRead, 'id' | 'read_at'>;
        Update: never;
      };
      muted_chats: {
        Row: MutedChat;
        Insert: Omit<MutedChat, 'id' | 'created_at'>;
        Update: Partial<Omit<MutedChat, 'id' | 'created_at'>>;
      };
      archived_chats: {
        Row: ArchivedChat;
        Insert: Omit<ArchivedChat, 'id' | 'archived_at'>;
        Update: never;
      };
      pinned_chats: {
        Row: PinnedChat;
        Insert: Omit<PinnedChat, 'id' | 'pinned_at'>;
        Update: Partial<Omit<PinnedChat, 'id' | 'pinned_at'>>;
      };
      unread_overrides: {
        Row: UnreadOverride;
        Insert: Omit<UnreadOverride, 'id' | 'created_at'>;
        Update: Partial<Omit<UnreadOverride, 'id' | 'created_at'>>;
      };
      message_reactions: {
        Row: MessageReaction;
        Insert: Omit<MessageReaction, 'id' | 'created_at'>;
        Update: never;
      };
      starred_messages: {
        Row: StarredMessage;
        Insert: Omit<StarredMessage, 'id' | 'starred_at'>;
        Update: never;
      };
      polls: {
        Row: Poll;
        Insert: Omit<Poll, 'id' | 'created_at'>;
        Update: Partial<Omit<Poll, 'id' | 'created_at'>>;
      };
      poll_votes: {
        Row: PollVote;
        Insert: Omit<PollVote, 'id' | 'created_at'>;
        Update: never;
      };
      call_records: {
        Row: CallRecord;
        Insert: Omit<CallRecord, 'id'>;
        Update: Partial<Omit<CallRecord, 'id'>>;
      };
      group_settings: {
        Row: GroupSettings;
        Insert: Omit<GroupSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GroupSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      disappearing_settings: {
        Row: DisappearingSetting;
        Insert: Omit<DisappearingSetting, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DisappearingSetting, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
