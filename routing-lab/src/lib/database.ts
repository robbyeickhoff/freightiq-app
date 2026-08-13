export type Json =
  | boolean
  | number
  | string
  | null
  | Json[]
  | { [key: string]: Json | undefined }

export type Database = {
  public: {
    Tables: {
      routing_lab_manifest_imports: {
        Row: {
          confirmed_stops: Json | null
          created_at: string
          extraction: Json
          id: string
          photo_manifest: Json
          status: string
          updated_at: string
          user_id: string
          working_state: Json
        }
        Insert: {
          confirmed_stops?: Json | null
          created_at?: string
          extraction: Json
          id: string
          photo_manifest?: Json
          status?: string
          updated_at?: string
          user_id: string
          working_state: Json
        }
        Update: {
          confirmed_stops?: Json | null
          created_at?: string
          extraction?: Json
          id?: string
          photo_manifest?: Json
          status?: string
          updated_at?: string
          user_id?: string
          working_state?: Json
        }
        Relationships: []
      }
      routing_lab_fixture_state: {
        Row: {
          fixture_id: string
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          fixture_id: string
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          fixture_id?: string
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routing_lab_sandbox_lessons: {
        Row: {
          approved_at: string
          category: string
          fixture_id: string
          lesson_text: string
          scope: string
          strength: string
          user_id: string
        }
        Insert: {
          approved_at?: string
          category: string
          fixture_id: string
          lesson_text: string
          scope: string
          strength: string
          user_id: string
        }
        Update: {
          approved_at?: string
          category?: string
          fixture_id?: string
          lesson_text?: string
          scope?: string
          strength?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
