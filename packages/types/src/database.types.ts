export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      discord_channels: {
        Row: {
          channel_id: string
          created_at: string | null
          id: number
          name: string
          server_id: string
          staging_channel: string | null
          uri: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: number
          name: string
          server_id: string
          staging_channel?: string | null
          uri: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: number
          name?: string
          server_id?: string
          staging_channel?: string | null
          uri?: string
        }
      }
      maps: {
        Row: {
          created_at: string | null
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string | null
        }
      }
      match_configs: {
        Row: {
          channel: number
          created_at: string
          draft: string
          id: number
          map_draft: string
          name: string
          size: number
        }
        Insert: {
          channel: number
          created_at?: string
          draft: string
          id?: number
          map_draft: string
          name: string
          size: number
        }
        Update: {
          channel?: number
          created_at?: string
          draft?: string
          id?: number
          map_draft?: string
          name?: string
          size?: number
        }
      }
      match_maps: {
        Row: {
          created_at: string | null
          map_id: number
          match_id: number
        }
        Insert: {
          created_at?: string | null
          map_id: number
          match_id: number
        }
        Update: {
          created_at?: string | null
          map_id?: number
          match_id?: number
        }
      }
      match_players: {
        Row: {
          captain: boolean
          match_id: number
          player_id: string
          ready: boolean
          team: string | null
          updated_at: string
        }
        Insert: {
          captain?: boolean
          match_id: number
          player_id: string
          ready?: boolean
          team?: string | null
          updated_at?: string
        }
        Update: {
          captain?: boolean
          match_id?: number
          player_id?: string
          ready?: boolean
          team?: string | null
          updated_at?: string
        }
      }
      matches: {
        Row: {
          channel: number | null
          closed_at: string | null
          created_at: string | null
          host: string | null
          id: number
          map_draft: string
          pick: string
          server: string | null
          size: number
          started_at: string | null
          status: string
        }
        Insert: {
          channel?: number | null
          closed_at?: string | null
          created_at?: string | null
          host?: string | null
          id?: number
          map_draft?: string
          pick?: string
          server?: string | null
          size?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          channel?: number | null
          closed_at?: string | null
          created_at?: string | null
          host?: string | null
          id?: number
          map_draft?: string
          pick?: string
          server?: string | null
          size?: number
          started_at?: string | null
          status?: string
        }
      }
      players: {
        Row: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url: string
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
      }
      rounds: {
        Row: {
          created_at: string
          id: number
          map: number
          pl: Json | null
          server: string
          si: Json | null
          team1_name: string
          team1_tickets: string
          team2_name: string
          team2_tickets: string
        }
        Insert: {
          created_at?: string
          id?: number
          map: number
          pl?: Json | null
          server: string
          si?: Json | null
          team1_name: string
          team1_tickets: string
          team2_name: string
          team2_tickets: string
        }
        Update: {
          created_at?: string
          id?: number
          map?: number
          pl?: Json | null
          server?: string
          si?: Json | null
          team1_name?: string
          team1_tickets?: string
          team2_name?: string
          team2_tickets?: string
        }
      }
      servers: {
        Row: {
          ip: string
          name: string
          port: string
          updated_at: string
        }
        Insert: {
          ip: string
          name: string
          port?: string
          updated_at?: string
        }
        Update: {
          ip?: string
          name?: string
          port?: string
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
