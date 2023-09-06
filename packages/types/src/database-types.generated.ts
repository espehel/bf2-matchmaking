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
      admin_roles: {
        Row: {
          created_at: string
          match_admin: boolean
          player_admin: boolean
          server_admin: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          match_admin?: boolean
          player_admin?: boolean
          server_admin?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          match_admin?: boolean
          player_admin?: boolean
          server_admin?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      discord_channels: {
        Row: {
          channel_id: string
          created_at: string | null
          id: number
          match_config: number | null
          name: string
          server_id: string
          staging_channel: string | null
          uri: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: number
          match_config?: number | null
          name: string
          server_id: string
          staging_channel?: string | null
          uri: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: number
          match_config?: number | null
          name?: string
          server_id?: string
          staging_channel?: string | null
          uri?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_channels_match_config_fkey"
            columns: ["match_config"]
            referencedRelation: "match_configs"
            referencedColumns: ["id"]
          }
        ]
      }
      maps: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      match_configs: {
        Row: {
          channel: string | null
          created_at: string
          draft: string
          id: number
          map_draft: string
          mode: string
          name: string
          owner: string
          permanent: boolean
          player_expire: number
          size: number
          updated_at: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          draft: string
          id?: number
          map_draft: string
          mode?: string
          name: string
          owner: string
          permanent?: boolean
          player_expire?: number
          size: number
          updated_at?: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          draft?: string
          id?: number
          map_draft?: string
          mode?: string
          name?: string
          owner?: string
          permanent?: boolean
          player_expire?: number
          size?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_configs_owner_fkey"
            columns: ["owner"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "match_maps_map_id_fkey"
            columns: ["map_id"]
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_maps_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          }
        ]
      }
      match_player_results: {
        Row: {
          created_at: string
          deaths: number
          kills: number
          match_id: number
          player_id: string
          rating_inc: number
          score: number
          team: number
        }
        Insert: {
          created_at?: string
          deaths: number
          kills: number
          match_id?: number
          player_id: string
          rating_inc: number
          score: number
          team?: number
        }
        Update: {
          created_at?: string
          deaths?: number
          kills?: number
          match_id?: number
          player_id?: string
          rating_inc?: number
          score?: number
          team?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_player_results_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_results_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_results_team_fkey"
            columns: ["team"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      match_players: {
        Row: {
          captain: boolean
          expire_at: string | null
          match_id: number
          player_id: string
          ready: boolean
          source: string | null
          team: string | null
          updated_at: string
        }
        Insert: {
          captain?: boolean
          expire_at?: string | null
          match_id: number
          player_id: string
          ready?: boolean
          source?: string | null
          team?: string | null
          updated_at?: string
        }
        Update: {
          captain?: boolean
          expire_at?: string | null
          match_id?: number
          player_id?: string
          ready?: boolean
          source?: string | null
          team?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
      match_results: {
        Row: {
          created_at: string
          is_winner: boolean
          maps: number
          match_id: number
          rounds: number
          team: number
          tickets: number
        }
        Insert: {
          created_at?: string
          is_winner: boolean
          maps: number
          match_id: number
          rounds: number
          team: number
          tickets: number
        }
        Update: {
          created_at?: string
          is_winner?: boolean
          maps?: number
          match_id?: number
          rounds?: number
          team?: number
          tickets?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_team_fkey"
            columns: ["team"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          closed_at: string | null
          config: number
          created_at: string | null
          id: number
          live_at: string | null
          ready_at: string | null
          server: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          closed_at?: string | null
          config: number
          created_at?: string | null
          id?: number
          live_at?: string | null
          ready_at?: string | null
          server?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          closed_at?: string | null
          config?: number
          created_at?: string | null
          id?: number
          live_at?: string | null
          ready_at?: string | null
          server?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_config_fkey"
            columns: ["config"]
            referencedRelation: "match_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_server_fkey"
            columns: ["server"]
            referencedRelation: "servers"
            referencedColumns: ["ip"]
          }
        ]
      }
      players: {
        Row: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          keyhash: string | null
          rating: number
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url: string
          created_at?: string
          full_name: string
          id: string
          keyhash?: string | null
          rating?: number
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          full_name?: string
          id?: string
          keyhash?: string | null
          rating?: number
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      rounds: {
        Row: {
          created_at: string
          id: number
          map: number
          match: number | null
          pl: Json | null
          server: string | null
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
          match?: number | null
          pl?: Json | null
          server?: string | null
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
          match?: number | null
          pl?: Json | null
          server?: string | null
          si?: Json | null
          team1_name?: string
          team1_tickets?: string
          team2_name?: string
          team2_tickets?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_map_fkey"
            columns: ["map"]
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_match_fkey"
            columns: ["match"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_server_fkey"
            columns: ["server"]
            referencedRelation: "servers"
            referencedColumns: ["ip"]
          }
        ]
      }
      server_rcons: {
        Row: {
          created_at: string | null
          id: string
          rcon_port: number
          rcon_pw: string
        }
        Insert: {
          created_at?: string | null
          id: string
          rcon_port: number
          rcon_pw: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rcon_port?: number
          rcon_pw?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_rcons_id_fkey"
            columns: ["id"]
            referencedRelation: "servers"
            referencedColumns: ["ip"]
          }
        ]
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
        Relationships: []
      }
      team_players: {
        Row: {
          captain: boolean
          created_at: string
          player_id: string
          team_id: number
        }
        Insert: {
          captain?: boolean
          created_at?: string
          player_id: string
          team_id: number
        }
        Update: {
          captain?: boolean
          created_at?: string
          player_id?: string
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_players_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          avatar: string | null
          created_at: string
          id: number
          name: string
          owner: string
          visible: boolean
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          id?: number
          name: string
          owner: string
          visible?: boolean
        }
        Update: {
          avatar?: string | null
          created_at?: string
          id?: number
          name?: string
          owner?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_fkey"
            columns: ["owner"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
