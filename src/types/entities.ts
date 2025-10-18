/**
 * Core Entity Types for Student Library App
 * Local-First Architecture with Supabase Sync
 */

// ============================================
// BASE TYPES & ENUMS
// ============================================

export type UUID = string;
export type Timestamp = string; // ISO 8601 format

export enum EntitySyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  FAILED = 'failed',
  CONFLICT = 'conflict'
}

export interface BaseEntity {
  id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at?: Timestamp | null;
  sync_status?: EntitySyncStatus;
  last_synced_at?: Timestamp | null;
}

// ============================================
// USER & AUTH
// ============================================

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'premium' | 'enterprise';
  subscription_expires_at?: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserProfile extends User {
  bio?: string;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  chat_notifications: boolean;
  reminder_notifications: boolean;
}

export interface UserStats {
  total_notes: number;
  total_messages: number;
  study_hours: number;
  courses_completed: number;
  resources_saved: number;
}

// ============================================
// CHAT & MESSAGING
// ============================================

export type ChatType = 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'poll';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Chat extends BaseEntity {
  type: ChatType;
  title: string;
  description?: string;
  avatar_url?: string;
  participants: UUID[];
  last_message_id?: UUID | null;
  last_message_preview?: string;
  last_activity_at: Timestamp;
  unread_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  is_muted: boolean;
  muted_until?: Timestamp | null;
}

export interface GroupChat extends Chat {
  type: 'group';
  created_by: UUID;
  admin_ids: UUID[];
  invite_link?: string;
  invite_code?: string;
  invite_expires_at?: Timestamp | null;
  settings: GroupChatSettings;
}

export interface GroupChatSettings {
  send_permission: 'everyone' | 'admins' | 'specific';
  edit_info_permission: 'everyone' | 'admins';
  max_members?: number;
  is_private: boolean;
}

export interface Message extends BaseEntity {
  chat_id: UUID;
  sender_id: UUID;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  message_type: MessageType;
  status: MessageStatus;
  reply_to_id?: UUID | null;
  reply_to_preview?: {
    sender_id: UUID;
    content: string;
    message_type: MessageType;
  };
  forwarded_from_id?: UUID | null;
  is_edited: boolean;
  edited_at?: Timestamp | null;
  is_pinned: boolean;
  is_starred: boolean;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  read_by: UUID[];
  delivered_to: UUID[];
}

export interface MessageAttachment {
  id: UUID;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number; // For video/audio
}

export interface MessageReaction {
  emoji: string;
  user_ids: UUID[];
  count: number;
}

export interface TypingIndicator {
  chat_id: UUID;
  user_id: UUID;
  user_name: string;
  last_typed_at: Timestamp;
}

export interface Poll extends BaseEntity {
  chat_id: UUID;
  created_by: UUID;
  question: string;
  options: PollOption[];
  allow_multiple: boolean;
  closes_at?: Timestamp | null;
  is_closed: boolean;
}

export interface PollOption {
  id: UUID;
  text: string;
  vote_count: number;
  voted_by: UUID[];
}

// ============================================
// NOTES
// ============================================

export type NoteFormat = 'markdown' | 'rich_text' | 'plain';

export interface Note extends BaseEntity {
  user_id: UUID;
  title: string;
  content: string;
  format: NoteFormat;
  tags: string[];
  category?: string;
  is_favorite: boolean;
  is_pinned: boolean;
  color?: string;
  attachments: NoteAttachment[];
  version: number;
  parent_id?: UUID | null; // For nested notes
  order: number; // For ordering in lists
}

export interface NoteAttachment {
  id: UUID;
  type: 'image' | 'file' | 'link';
  url: string;
  title?: string;
  thumbnail_url?: string;
}

export interface NoteVersion extends BaseEntity {
  note_id: UUID;
  version: number;
  title: string;
  content: string;
  changed_by: UUID;
}

// ============================================
// REMINDERS
// ============================================

export type ReminderType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReminderPriority = 'low' | 'medium' | 'high';
export type ReminderStatus = 'pending' | 'completed' | 'dismissed' | 'snoozed';

export interface Reminder extends BaseEntity {
  user_id: UUID;
  title: string;
  description?: string;
  reminder_type: ReminderType;
  priority: ReminderPriority;
  status: ReminderStatus;
  remind_at: Timestamp;
  completed_at?: Timestamp | null;
  snoozed_until?: Timestamp | null;
  recurrence_rule?: RecurrenceRule;
  tags: string[];
  related_entity_type?: 'note' | 'course' | 'resource';
  related_entity_id?: UUID;
  notification_sent: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months
  days_of_week?: number[]; // 0-6 for Sunday-Saturday
  day_of_month?: number;
  end_date?: Timestamp | null;
  occurrences?: number;
}

// ============================================
// VIDEO COURSES
// ============================================

export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Course extends BaseEntity {
  title: string;
  description: string;
  instructor_id: UUID;
  instructor_name: string;
  instructor_avatar?: string;
  thumbnail_url?: string;
  category: string;
  tags: string[];
  difficulty: CourseDifficulty;
  duration_minutes: number;
  status: CourseStatus;
  price: number;
  is_free: boolean;
  rating: number;
  review_count: number;
  enrollment_count: number;
  lessons: CourseLesson[];
}

export interface CourseLesson extends BaseEntity {
  course_id: UUID;
  title: string;
  description?: string;
  video_url?: string;
  video_duration: number;
  order: number;
  is_preview: boolean; // Can be viewed without enrollment
  resources: CourseLessonResource[];
}

export interface CourseLessonResource {
  id: UUID;
  type: 'pdf' | 'link' | 'code' | 'quiz';
  title: string;
  url?: string;
  content?: string;
}

export interface CourseProgress extends BaseEntity {
  user_id: UUID;
  course_id: UUID;
  completed_lessons: UUID[];
  current_lesson_id?: UUID | null;
  last_watched_at: Timestamp;
  progress_percentage: number;
  time_spent_minutes: number;
  is_completed: boolean;
  completed_at?: Timestamp | null;
  certificate_url?: string;
}

export interface LessonProgress {
  lesson_id: UUID;
  watched_duration: number;
  total_duration: number;
  is_completed: boolean;
  last_position: number; // Resume from this position
  completed_at?: Timestamp | null;
}

// ============================================
// STUDY RESOURCES
// ============================================

export type ResourceType = 'book' | 'article' | 'pdf' | 'video' | 'link' | 'quiz';
export type ResourceStatus = 'pending' | 'approved' | 'rejected';

export interface Resource extends BaseEntity {
  user_id: UUID;
  title: string;
  description?: string;
  resource_type: ResourceType;
  url?: string;
  file_url?: string;
  file_size?: number;
  thumbnail_url?: string;
  category: string;
  tags: string[];
  status: ResourceStatus;
  is_public: boolean;
  view_count: number;
  download_count: number;
  rating: number;
  review_count: number;
}

export interface ResourceBookmark extends BaseEntity {
  user_id: UUID;
  resource_id: UUID;
  notes?: string;
  tags: string[];
}

export interface ResourceProgress extends BaseEntity {
  user_id: UUID;
  resource_id: UUID;
  progress_percentage: number;
  current_page?: number;
  total_pages?: number;
  last_accessed_at: Timestamp;
  is_completed: boolean;
  completed_at?: Timestamp | null;
}

// ============================================
// AI ASSISTANT
// ============================================

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'local';
export type AIMessageRole = 'user' | 'assistant' | 'system';

export interface AIConversation extends BaseEntity {
  user_id: UUID;
  title: string;
  model: string;
  provider: AIProvider;
  context_entities: AIContextEntity[];
  message_count: number;
  last_message_at: Timestamp;
}

export interface AIContextEntity {
  type: 'note' | 'course' | 'resource' | 'message';
  id: UUID;
  title: string;
  snippet?: string;
}

export interface AIMessage extends BaseEntity {
  conversation_id: UUID;
  role: AIMessageRole;
  content: string;
  tokens_used?: number;
  model?: string;
  attachments: AIMessageAttachment[];
}

export interface AIMessageAttachment {
  id: UUID;
  type: 'image' | 'file' | 'code' | 'reference';
  url?: string;
  content?: string;
  language?: string; // For code blocks
  reference_type?: 'note' | 'course' | 'resource';
  reference_id?: UUID;
}

export interface AISettings {
  user_id: UUID;
  provider: AIProvider;
  model: string;
  temperature: number;
  max_tokens: number;
  context_window: number;
  enable_context_from_notes: boolean;
  enable_context_from_courses: boolean;
  enable_context_from_resources: boolean;
  api_key_encrypted?: string;
}

// ============================================
// FORUMS
// ============================================

export type ForumThreadStatus = 'open' | 'closed' | 'pinned' | 'locked';

export interface ForumCategory extends BaseEntity {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  thread_count: number;
  post_count: number;
  order: number;
}

export interface ForumThread extends BaseEntity {
  category_id: UUID;
  author_id: UUID;
  author_name: string;
  author_avatar?: string;
  title: string;
  content: string;
  status: ForumThreadStatus;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at?: Timestamp | null;
  last_reply_by?: UUID | null;
  tags: string[];
  attachments: ForumAttachment[];
}

export interface ForumPost extends BaseEntity {
  thread_id: UUID;
  author_id: UUID;
  author_name: string;
  author_avatar?: string;
  content: string;
  reply_to_id?: UUID | null;
  is_edited: boolean;
  edited_at?: Timestamp | null;
  upvotes: number;
  downvotes: number;
  voted_by: { user_id: UUID; vote_type: 'up' | 'down' }[];
  attachments: ForumAttachment[];
}

export interface ForumAttachment {
  id: UUID;
  type: 'image' | 'file' | 'video';
  url: string;
  file_name?: string;
  file_size?: number;
  thumbnail_url?: string;
}

// ============================================
// NOTIFICATIONS
// ============================================

export type NotificationType = 
  | 'message' 
  | 'reminder' 
  | 'forum_reply' 
  | 'course_update' 
  | 'resource_comment'
  | 'system';

export interface Notification extends BaseEntity {
  user_id: UUID;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  action_url?: string;
  related_entity_type?: string;
  related_entity_id?: UUID;
  is_read: boolean;
  read_at?: Timestamp | null;
}

// ============================================
// SEARCH & FILTERS
// ============================================

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  entity_types?: ('note' | 'message' | 'course' | 'resource' | 'forum')[];
  tags?: string[];
  categories?: string[];
  date_from?: Timestamp;
  date_to?: Timestamp;
  created_by?: UUID;
}

export interface SearchResult {
  entity_type: 'note' | 'message' | 'course' | 'resource' | 'forum' | 'user';
  entity_id: UUID;
  title: string;
  snippet: string;
  highlight: string[];
  relevance_score: number;
  created_at: Timestamp;
  entity_data: any;
}

// ============================================
// SYNC & OFFLINE QUEUE
// ============================================

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';
export type EntityType = 
  | 'chat' 
  | 'message' 
  | 'note' 
  | 'reminder' 
  | 'course_progress' 
  | 'resource_bookmark'
  | 'forum_post'
  | 'ai_message';

export interface SyncQueue extends BaseEntity {
  user_id: UUID;
  entity_type: EntityType;
  entity_id: UUID;
  operation: OperationType;
  payload: any;
  retry_count: number;
  last_retry_at?: Timestamp | null;
  error_message?: string;
}

export interface SyncMetadata {
  entity_type: EntityType;
  entity_id: UUID;
  local_version: number;
  remote_version: number;
  last_synced_at: Timestamp;
  has_conflict: boolean;
}

// ============================================
// APP STATE & SETTINGS
// ============================================

export interface AppSettings {
  offline_mode: boolean;
  auto_sync: boolean;
  sync_on_wifi_only: boolean;
  cache_size_mb: number;
  data_saver_mode: boolean;
  background_sync_interval: number; // minutes
  max_offline_messages: number;
  media_auto_download: boolean;
}

export interface AppSyncStatus {
  is_online: boolean;
  is_syncing: boolean;
  pending_operations: number;
  last_sync_at?: Timestamp | null;
  next_sync_at?: Timestamp | null;
  sync_errors: string[];
}
