export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      app_cache: {
        Row: {
          cache_key: string
          cache_value: Json
          created_at: string | null
          expires_at: string
          id: string
          updated_at: string | null
        }
        Insert: {
          cache_key: string
          cache_value: Json
          created_at?: string | null
          expires_at: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          cache_key?: string
          cache_value?: Json
          created_at?: string | null
          expires_at?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      archived_chats: {
        Row: {
          archived_at: string
          chat_id: string
          chat_type: string
          id: number
          user_id: string
        }
        Insert: {
          archived_at?: string
          chat_id: string
          chat_type: string
          id?: number
          user_id: string
        }
        Update: {
          archived_at?: string
          chat_id?: string
          chat_type?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          page_number: number | null
          position: Json | null
          resource_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          page_number?: number | null
          position?: Json | null
          resource_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          page_number?: number | null
          position?: Json | null
          resource_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      call_records: {
        Row: {
          call_type: string
          chat_id: string
          chat_type: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          initiated_by: string
          participants: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          call_type: string
          chat_id: string
          chat_type: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiated_by: string
          participants?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          call_type?: string
          chat_id?: string
          chat_type?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiated_by?: string
          participants?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_session_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_archived: boolean
          is_muted: boolean
          is_pinned: boolean
          last_activity_at: string
          last_message_id: string | null
          last_message_preview: string | null
          last_synced_at: string | null
          muted_until: string | null
          participants: string[]
          sync_status: string | null
          title: string
          type: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          is_muted?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          last_message_id?: string | null
          last_message_preview?: string | null
          last_synced_at?: string | null
          muted_until?: string | null
          participants?: string[]
          sync_status?: string | null
          title: string
          type: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          is_muted?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          last_message_id?: string | null
          last_message_preview?: string | null
          last_synced_at?: string | null
          muted_until?: string | null
          participants?: string[]
          sync_status?: string | null
          title?: string
          type?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      collaborative_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          last_updated: string | null
          resource_id: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          resource_id?: string | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          resource_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_notes_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborative_notes_versions: {
        Row: {
          content: string | null
          note_id: string | null
          updated_at: string | null
          updated_by: string | null
          version_id: string
        }
        Insert: {
          content?: string | null
          note_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version_id?: string
        }
        Update: {
          content?: string | null
          note_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_notes_versions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "collaborative_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_notes_versions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          created_at: string | null
          deleted_by_receiver: boolean | null
          deleted_by_sender: boolean | null
          edited_at: string | null
          encrypted_content: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          forwarded_from_message_id: string | null
          id: string
          is_pinned_by_receiver: boolean | null
          is_pinned_by_sender: boolean | null
          is_read: boolean | null
          message_type: string
          receiver_id: string
          reply_to_message_id: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_by_receiver?: boolean | null
          deleted_by_sender?: boolean | null
          edited_at?: string | null
          encrypted_content?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          is_pinned_by_receiver?: boolean | null
          is_pinned_by_sender?: boolean | null
          is_read?: boolean | null
          message_type?: string
          receiver_id: string
          reply_to_message_id?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_by_receiver?: boolean | null
          deleted_by_sender?: boolean | null
          edited_at?: string | null
          encrypted_content?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          is_pinned_by_receiver?: boolean | null
          is_pinned_by_sender?: boolean | null
          is_read?: boolean | null
          message_type?: string
          receiver_id?: string
          reply_to_message_id?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      disappearing_settings: {
        Row: {
          chat_id: string
          chat_type: string
          id: string
          mode: string | null
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          chat_id: string
          chat_type: string
          id?: string
          mode?: string | null
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          chat_id?: string
          chat_type?: string
          id?: string
          mode?: string | null
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_processed: boolean | null
          updated_at: string | null
          upload_date: string | null
          user_id: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_processed?: boolean | null
          updated_at?: string | null
          upload_date?: string | null
          user_id: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_processed?: boolean | null
          updated_at?: string | null
          upload_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      forum_comments: {
        Row: {
          comment_text: string | null
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          comment_text?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment_text?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          category_id: string | null
          content: string | null
          created_at: string | null
          id: string
          subject: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification: {
        Row: {
          badges: string[] | null
          last_updated: string | null
          level: number | null
          points: number | null
          user_id: string
        }
        Insert: {
          badges?: string[] | null
          last_updated?: string | null
          level?: number | null
          points?: number | null
          user_id: string
        }
        Update: {
          badges?: string[] | null
          last_updated?: string | null
          level?: number | null
          points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invite_logs: {
        Row: {
          group_id: string
          id: string
          invite_code: string
          ip_address: string | null
          success: boolean
          used_at: string | null
          used_by: string | null
          user_agent: string | null
        }
        Insert: {
          group_id: string
          id?: string
          invite_code: string
          ip_address?: string | null
          success: boolean
          used_at?: string | null
          used_by?: string | null
          user_agent?: string | null
        }
        Update: {
          group_id?: string
          id?: string
          invite_code?: string
          ip_address?: string | null
          success?: boolean
          used_at?: string | null
          used_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_invite_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          encrypted_content: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          forwarded_from_message_id: string | null
          group_id: string
          id: string
          is_pinned: boolean | null
          message_type: string
          reply_to_message_id: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          encrypted_content?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          forwarded_from_message_id?: string | null
          group_id: string
          id?: string
          is_pinned?: boolean | null
          message_type?: string
          reply_to_message_id?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          encrypted_content?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          forwarded_from_message_id?: string | null
          group_id?: string
          id?: string
          is_pinned?: boolean | null
          message_type?: string
          reply_to_message_id?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_settings: {
        Row: {
          edit_info_permission: string | null
          group_id: string
          id: string
          send_permission: string | null
          updated_at: string | null
        }
        Insert: {
          edit_info_permission?: string | null
          group_id: string
          id?: string
          send_permission?: string | null
          updated_at?: string | null
        }
        Update: {
          edit_info_permission?: string | null
          group_id?: string
          id?: string
          send_permission?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_settings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          created_at: string | null
          highlighted_text: string | null
          id: string
          location: string | null
          note: string | null
          resource_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          highlighted_text?: string | null
          id?: string
          location?: string | null
          note?: string | null
          resource_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          highlighted_text?: string | null
          id?: string
          location?: string | null
          note?: string | null
          resource_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "highlights_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          chat_type: string
          created_at: string | null
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          chat_type: string
          created_at?: string | null
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          chat_type?: string
          created_at?: string | null
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_replies: {
        Row: {
          chat_type: string
          created_at: string | null
          id: string
          parent_message_id: string
          reply_message_id: string
        }
        Insert: {
          chat_type: string
          created_at?: string | null
          id?: string
          parent_message_id: string
          reply_message_id: string
        }
        Update: {
          chat_type?: string
          created_at?: string | null
          id?: string
          parent_message_id?: string
          reply_message_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          chat_id: string
          content: string
          created_at: string
          deleted_at: string | null
          delivered_to: string[] | null
          edited_at: string | null
          forwarded_from_id: string | null
          id: string
          is_edited: boolean
          is_pinned: boolean
          is_starred: boolean
          last_synced_at: string | null
          message_type: string
          reactions: Json | null
          read_by: string[] | null
          reply_to_id: string | null
          sender_avatar: string | null
          sender_id: string
          sender_name: string | null
          status: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          chat_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          delivered_to?: string[] | null
          edited_at?: string | null
          forwarded_from_id?: string | null
          id?: string
          is_edited?: boolean
          is_pinned?: boolean
          is_starred?: boolean
          last_synced_at?: string | null
          message_type?: string
          reactions?: Json | null
          read_by?: string[] | null
          reply_to_id?: string | null
          sender_avatar?: string | null
          sender_id: string
          sender_name?: string | null
          status?: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          chat_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          delivered_to?: string[] | null
          edited_at?: string | null
          forwarded_from_id?: string | null
          id?: string
          is_edited?: boolean
          is_pinned?: boolean
          is_starred?: boolean
          last_synced_at?: string | null
          message_type?: string
          reactions?: Json | null
          read_by?: string[] | null
          reply_to_id?: string | null
          sender_avatar?: string | null
          sender_id?: string
          sender_name?: string | null
          status?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      muted_chats: {
        Row: {
          chat_id: string
          chat_type: string
          created_at: string
          id: number
          muted_until: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          chat_type: string
          created_at?: string
          id?: number
          muted_until?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          chat_type?: string
          created_at?: string
          id?: number
          muted_until?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_favorite: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_chats: {
        Row: {
          chat_id: string
          chat_type: string
          id: string
          pinned_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          chat_type: string
          id?: string
          pinned_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          chat_type?: string
          id?: string
          pinned_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          id: string
          option_id: string
          poll_id: string
          user_id: string
          voted_at: string | null
        }
        Insert: {
          id?: string
          option_id: string
          poll_id: string
          user_id: string
          voted_at?: string | null
        }
        Update: {
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple: boolean | null
          chat_id: string
          chat_type: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_closed: boolean | null
          options: Json
          question: string
        }
        Insert: {
          allow_multiple?: boolean | null
          chat_id: string
          chat_type: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_closed?: boolean | null
          options: Json
          question: string
        }
        Update: {
          allow_multiple?: boolean | null
          chat_id?: string
          chat_type?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_closed?: boolean | null
          options?: Json
          question?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          reminder_date: string
          reminder_type: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          reminder_date: string
          reminder_type?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          reminder_date?: string
          reminder_type?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resource_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      resource_tags: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string | null
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resource_id?: string | null
          tag_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string | null
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_tags_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          author: string | null
          class: string | null
          description: string | null
          download_count: number | null
          file_url: string | null
          id: string
          offline_access: boolean | null
          premium_content: boolean | null
          resource_type: string
          subject: string | null
          title: string
          upload_date: string | null
          uploader_id: string | null
        }
        Insert: {
          author?: string | null
          class?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          offline_access?: boolean | null
          premium_content?: boolean | null
          resource_type: string
          subject?: string | null
          title: string
          upload_date?: string | null
          uploader_id?: string | null
        }
        Update: {
          author?: string | null
          class?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          offline_access?: boolean | null
          premium_content?: boolean | null
          resource_type?: string
          subject?: string | null
          title?: string
          upload_date?: string | null
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      starred_messages: {
        Row: {
          chat_type: string
          id: string
          message_id: string
          starred_at: string | null
          user_id: string
        }
        Insert: {
          chat_type: string
          id?: string
          message_id: string
          starred_at?: string | null
          user_id: string
        }
        Update: {
          chat_type?: string
          id?: string
          message_id?: string
          starred_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          invite_expires_at: string | null
          invite_link: string | null
          invite_max_uses: number | null
          invite_uses: number | null
          is_private: boolean | null
          max_members: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          invite_link?: string | null
          invite_max_uses?: number | null
          invite_uses?: number | null
          is_private?: boolean | null
          max_members?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          invite_link?: string | null
          invite_max_uses?: number | null
          invite_uses?: number | null
          is_private?: boolean | null
          max_members?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      study_plan_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          plan_id: string | null
          resource_id: string | null
          task_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          plan_id?: string | null
          resource_id?: string | null
          task_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          plan_id?: string | null
          resource_id?: string | null
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plan_tasks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          plan_name: string
          start_date: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          plan_name: string
          start_date?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          plan_name?: string
          start_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_reminders: {
        Row: {
          created_at: string | null
          id: string
          reminder_text: string | null
          reminder_time: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reminder_text?: string | null
          reminder_time?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reminder_text?: string | null
          reminder_time?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          download_limit: number | null
          downloads_used: number | null
          email: string
          group_limit: number | null
          groups_joined: number | null
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          download_limit?: number | null
          downloads_used?: number | null
          email: string
          group_limit?: number | null
          groups_joined?: number | null
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          download_limit?: number | null
          downloads_used?: number | null
          email?: string
          group_limit?: number | null
          groups_joined?: number | null
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      typing_status: {
        Row: {
          chat_id: string
          chat_type: string
          id: string
          is_typing: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          chat_type: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          chat_type?: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unread_overrides: {
        Row: {
          chat_id: string
          chat_type: string
          force_unread: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          chat_type: string
          force_unread?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          chat_type?: string
          force_unread?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          model: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          model?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          model?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_downloads: {
        Row: {
          downloaded_at: string | null
          id: string
          resource_id: string | null
          user_id: string
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          resource_id?: string | null
          user_id: string
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          resource_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_downloads_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          resource_id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          resource_id: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          resource_id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          last_online: string | null
          online: boolean | null
          user_id: string
        }
        Insert: {
          last_online?: string | null
          online?: boolean | null
          user_id: string
        }
        Update: {
          last_online?: string | null
          online?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          last_accessed: string | null
          progress_percentage: number | null
          resource_id: string
          user_id: string
        }
        Insert: {
          last_accessed?: string | null
          progress_percentage?: number | null
          resource_id: string
          user_id: string
        }
        Update: {
          last_accessed?: string | null
          progress_percentage?: number | null
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          id: string
          last_activity: string | null
          session_data: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          session_data?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          session_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          activity_status: boolean | null
          ai_autocomplete: boolean | null
          ai_suggestions: boolean | null
          created_at: string | null
          data_collection: boolean | null
          email_notifications: boolean | null
          font_size: string | null
          id: string
          new_messages: boolean | null
          profile_visibility: boolean | null
          push_notifications: boolean | null
          study_reminders: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_status?: boolean | null
          ai_autocomplete?: boolean | null
          ai_suggestions?: boolean | null
          created_at?: string | null
          data_collection?: boolean | null
          email_notifications?: boolean | null
          font_size?: string | null
          id?: string
          new_messages?: boolean | null
          profile_visibility?: boolean | null
          push_notifications?: boolean | null
          study_reminders?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_status?: boolean | null
          ai_autocomplete?: boolean | null
          ai_suggestions?: boolean | null
          created_at?: string | null
          data_collection?: boolean | null
          email_notifications?: boolean | null
          font_size?: string | null
          id?: string
          new_messages?: boolean | null
          profile_visibility?: boolean | null
          push_notifications?: boolean | null
          study_reminders?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_online: boolean | null
          last_seen_at: string | null
          location: string | null
          profession: string | null
          regions: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          location?: string | null
          profession?: string | null
          regions?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          location?: string | null
          profession?: string | null
          regions?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      chat_session_summaries: {
        Row: {
          created_at: string | null
          derived_title: string | null
          id: string | null
          last_message_at: string | null
          message_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          derived_title?: never
          id?: string | null
          last_message_at?: never
          message_count?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          derived_title?: never
          id?: string | null
          last_message_at?: never
          message_count?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_download_limit: { Args: { user_uuid: string }; Returns: boolean }
      check_group_limit: { Args: { user_uuid: string }; Returns: boolean }
      cleanup_expired_cache: { Args: never; Returns: undefined }
      create_conversation_notification: {
        Args: {
          p_conversation_id: string
          p_preview: string
          p_sender_name: string
          p_user_id: string
        }
        Returns: string
      }
      create_forum_notification: {
        Args: {
          p_action: string
          p_actor_name: string
          p_forum_id: string
          p_forum_title: string
          p_user_id: string
        }
        Returns: string
      }
      create_group_invite_link: {
        Args: {
          p_expires_in_hours?: number
          p_group_id: string
          p_max_uses?: number
        }
        Returns: {
          expires_at: string
          invite_code: string
          invite_link: string
        }[]
      }
      create_reminder_notification: {
        Args: {
          p_message: string
          p_reminder_time: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      create_subscription_notification: {
        Args: {
          p_message: string
          p_subscription_type: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      create_video_course_notification: {
        Args: {
          p_course_id: string
          p_course_title: string
          p_message: string
          p_user_id: string
        }
        Returns: string
      }
      current_user_id: { Args: never; Returns: string }
      generate_invite_code: { Args: never; Returns: string }
      get_auth_email: { Args: never; Returns: string }
      get_auth_uid: { Args: never; Returns: string }
      get_cache: { Args: { cache_key_param: string }; Returns: Json }
      get_messages_since: {
        Args: { p_group_id: string; p_since_timestamp: string }
        Returns: {
          created_at: string
          encrypted_content: string
          id: string
          message_type: string
          reply_to_message_id: string
          sender_id: string
          updated_at: string
        }[]
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_chat_summaries: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          derived_title: string
          id: string
          last_message_at: string
          message_count: number
          updated_at: string
          user_id: string
        }[]
      }
      get_user_chats: {
        Args: { user_uuid: string }
        Returns: {
          chat_avatar: string
          chat_id: string
          chat_name: string
          chat_type: string
          is_pinned: boolean
          last_message_content: string
          last_message_id: string
          last_message_time: string
          last_message_type: string
          member_count: number
          unread_count: number
        }[]
      }
      get_user_profiles_batch: {
        Args: { user_ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          status: string
        }[]
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id?: string }
        Returns: boolean
      }
      join_group_via_invite: {
        Args: { p_invite_code: string; p_user_id: string }
        Returns: {
          group_id: string
          group_name: string
          message: string
          success: boolean
        }[]
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      set_cache: {
        Args: {
          cache_key_param: string
          cache_value_param: Json
          ttl_minutes?: number
        }
        Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
