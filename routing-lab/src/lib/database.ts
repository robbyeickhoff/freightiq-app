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
      routing_lab_manifest_lessons: {
        Row: { approved_at: string; category: string; evidence: Json; id: string; impact: string; known_exceptions: string; lesson_text: string; operational_reason: string; scope_type: string; scope_value: string; source_route_id: string; status: string; strength: string; user_id: string }
        Insert: { approved_at?: string; category: string; evidence: Json; id: string; impact: string; known_exceptions?: string; lesson_text: string; operational_reason: string; scope_type: string; scope_value: string; source_route_id: string; status?: string; strength: string; user_id: string }
        Update: { approved_at?: string; category?: string; evidence?: Json; id?: string; impact?: string; known_exceptions?: string; lesson_text?: string; operational_reason?: string; scope_type?: string; scope_value?: string; source_route_id?: string; status?: string; strength?: string; user_id?: string }
        Relationships: []
      }
      routing_lab_routes: {
        Row: {
          adjusted_stop_ids: Json
          created_at: string
          id: string
          manifest_import_id: string
          planned_corrections: Json
          route_kind: string
          route_proposal: Json
          run_state: Json
          setup: Json
          source_stops: Json
          status: string
          updated_at: string
          user_id: string
          zone_review: Json
        }
        Insert: {
          adjusted_stop_ids?: Json
          created_at?: string
          id: string
          manifest_import_id: string
          planned_corrections?: Json
          route_kind?: string
          route_proposal?: Json
          run_state?: Json
          setup: Json
          source_stops: Json
          status?: string
          updated_at?: string
          user_id: string
          zone_review?: Json
        }
        Update: {
          adjusted_stop_ids?: Json
          created_at?: string
          id?: string
          manifest_import_id?: string
          planned_corrections?: Json
          route_kind?: string
          route_proposal?: Json
          run_state?: Json
          setup?: Json
          source_stops?: Json
          status?: string
          updated_at?: string
          user_id?: string
          zone_review?: Json
        }
        Relationships: []
      }
      routing_lab_zone_evidence: {
        Row: { address: string; address_key: string; approved_zone: string; city: string; confirmed_at: string; id: string; postal_code: string; source_route_id: string; source_stop_id: string; state: string; updated_at: string; user_id: string }
        Insert: { address: string; address_key: string; approved_zone: string; city: string; confirmed_at?: string; id?: string; postal_code: string; source_route_id: string; source_stop_id: string; state: string; updated_at?: string; user_id: string }
        Update: { address?: string; address_key?: string; approved_zone?: string; city?: string; confirmed_at?: string; id?: string; postal_code?: string; source_route_id?: string; source_stop_id?: string; state?: string; updated_at?: string; user_id?: string }
        Relationships: []
      }
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
    Functions: {
      save_routing_lab_zone_review: {
        Args: { p_complete: boolean; p_evidence: Json; p_route_id: string; p_zone_review: Json }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
