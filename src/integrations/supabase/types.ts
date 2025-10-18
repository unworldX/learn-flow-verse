export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'conversation' | 'reminder' | 'update' | 'forum' | 'subscription' | 'video_course' | 'system'
          title: string
          message: string
          read: boolean
          link: string | null
          metadata: Json | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'conversation' | 'reminder' | 'update' | 'forum' | 'subscription' | 'video_course' | 'system'
          title: string
          message: string
          read?: boolean
          link?: string | null
          metadata?: Json | null
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'conversation' | 'reminder' | 'update' | 'forum' | 'subscription' | 'video_course' | 'system'
          title?: string
          message?: string
          read?: boolean
          link?: string | null
          metadata?: Json | null
          created_at?: string
          read_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_conversation_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_link?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_reminder_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_link?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_forum_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_link?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_subscription_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_link?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_video_course_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_link?: string
          p_metadata?: Json
        }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: {
          p_user_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
