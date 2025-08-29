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
      clients: {
        Row: {
          id: string
          name: string
          domain: string
          report_token: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          report_token?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          report_token?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      google_credentials: {
        Row: {
          id: string
          client_id: string
          access_token: string | null
          refresh_token: string | null
          token_expiry: string | null
          gsc_site_url: string | null
          ga4_property_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          access_token?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          gsc_site_url?: string | null
          ga4_property_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          gsc_site_url?: string | null
          ga4_property_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      metrics_cache: {
        Row: {
          id: string
          client_id: string
          metric_type: string
          date_range: string | null
          data: Json
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          metric_type: string
          date_range?: string | null
          data: Json
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          metric_type?: string
          date_range?: string | null
          data?: Json
          expires_at?: string
          created_at?: string
        }
      }
      historical_metrics: {
        Row: {
          id: string
          client_id: string
          date: string
          metrics: Json
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          date: string
          metrics: Json
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          date?: string
          metrics?: Json
          created_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}