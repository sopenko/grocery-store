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
      users: {
        Row: {
          id: string
          username: string
          email: string
          full_name: string | null
          role: 'learner' | 'teacher' | 'moderator' | 'admin'
          points: number
          streak_days: number
          last_active: string | null
          avatar_url: string | null
          bio: string | null
          phone: string | null
          address: string | null
          is_resident: boolean
          notification_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          full_name?: string | null
          role?: 'learner' | 'teacher' | 'moderator' | 'admin'
          points?: number
          streak_days?: number
          last_active?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          address?: string | null
          is_resident?: boolean
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          full_name?: string | null
          role?: 'learner' | 'teacher' | 'moderator' | 'admin'
          points?: number
          streak_days?: number
          last_active?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          address?: string | null
          is_resident?: boolean
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      town_apps: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon_url: string | null
          app_url: string
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon_url?: string | null
          app_url: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon_url?: string | null
          app_url?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          category: string | null
          author_id: string | null
          is_published: boolean
          published_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          category?: string | null
          author_id?: string | null
          is_published?: boolean
          published_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string | null
          author_id?: string | null
          is_published?: boolean
          published_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          location: string | null
          start_time: string
          end_time: string | null
          category: string | null
          organizer_id: string | null
          is_published: boolean
          max_attendees: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          location?: string | null
          start_time: string
          end_time?: string | null
          category?: string | null
          organizer_id?: string | null
          is_published?: boolean
          max_attendees?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          location?: string | null
          start_time?: string
          end_time?: string | null
          category?: string | null
          organizer_id?: string | null
          is_published?: boolean
          max_attendees?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: string
          owner_id: string | null
          phone: string | null
          email: string | null
          address: string | null
          hours: Json
          logo_url: string | null
          website_url: string | null
          social_links: Json
          is_verified: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category: string
          owner_id?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          hours?: Json
          logo_url?: string | null
          website_url?: string | null
          social_links?: Json
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: string
          owner_id?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          hours?: Json
          logo_url?: string | null
          website_url?: string | null
          social_links?: Json
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
