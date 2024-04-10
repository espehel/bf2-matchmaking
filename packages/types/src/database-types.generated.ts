export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_matches: {
        Row: {
          away_accepted: boolean
          created_at: string
          event: number
          home_accepted: boolean
          match: number
          round: number
        }
        Insert: {
          away_accepted?: boolean
          created_at?: string
          event: number
          home_accepted?: boolean
          match: number
          round: number
        }
        Update: {
          away_accepted?: boolean
          created_at?: string
          event?: number
          home_accepted?: boolean
          match?: number
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_matches_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_matches_match_fkey"
            columns: ["match"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_matches_round_fkey"
            columns: ["round"]
            isOneToOne: false
            referencedRelation: "event_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rounds: {
        Row: {
          created_at: string
          event: number
          id: number
          label: string
          start_at: string
        }
        Insert: {
          created_at?: string
          event: number
          id?: number
          label: string
          start_at: string
        }
        Update: {
          created_at?: string
          event?: number
          id?: number
          label?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rounds_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_teams: {
        Row: {
          created_at: string
          event: number
          team: number
        }
        Insert: {
          created_at?: string
          event: number
          team: number
        }
        Update: {
          created_at?: string
          event?: number
          team?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_teams_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_teams_team_fkey"
            columns: ["team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          config: number
          created_at: string
          id: number
          name: string
          owner: string
        }
        Insert: {
          config: number
          created_at?: string
          id?: number
          name: string
          owner: string
        }
        Update: {
          config?: number
          created_at?: string
          id?: number
          name?: string
          owner?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_config_fkey"
            columns: ["config"]
            isOneToOne: false
            referencedRelation: "match_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_servers: {
        Row: {
          address: string | null
          created_at: string
          id: number
          instance: string | null
          match_id: number | null
          region: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: number
          instance?: string | null
          match_id?: number | null
          region: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: number
          instance?: string | null
          match_id?: number | null
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_generated_servers_address_fkey"
            columns: ["address"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["ip"]
          },
          {
            foreignKeyName: "public_generated_servers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
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
          fixed_ratings: boolean
          guild: string | null
          id: number
          map_draft: string
          maps: number
          name: string
          owner: string
          player_expire: number
          size: number
          type: Database["public"]["Enums"]["match_type"]
          updated_at: string
          vehicles: boolean
          visible: boolean
        }
        Insert: {
          channel?: string | null
          created_at?: string
          draft: string
          fixed_ratings?: boolean
          guild?: string | null
          id?: number
          map_draft: string
          maps?: number
          name: string
          owner: string
          player_expire?: number
          size: number
          type?: Database["public"]["Enums"]["match_type"]
          updated_at?: string
          vehicles?: boolean
          visible?: boolean
        }
        Update: {
          channel?: string | null
          created_at?: string
          draft?: string
          fixed_ratings?: boolean
          guild?: string | null
          id?: number
          map_draft?: string
          maps?: number
          name?: string
          owner?: string
          player_expire?: number
          size?: number
          type?: Database["public"]["Enums"]["match_type"]
          updated_at?: string
          vehicles?: boolean
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "match_configs_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
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
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_maps_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_player_results: {
        Row: {
          created_at: string
          deaths: number
          info: Json | null
          join_time: number | null
          kills: number
          match_id: number
          player_id: string
          rating_inc: number | null
          score: number
          team: number
        }
        Insert: {
          created_at?: string
          deaths: number
          info?: Json | null
          join_time?: number | null
          kills: number
          match_id?: number
          player_id: string
          rating_inc?: number | null
          score: number
          team?: number
        }
        Update: {
          created_at?: string
          deaths?: number
          info?: Json | null
          join_time?: number | null
          kills?: number
          match_id?: number
          player_id?: string
          rating_inc?: number | null
          score?: number
          team?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_player_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_results_team_fkey"
            columns: ["team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_players: {
        Row: {
          captain: boolean
          connected_at: string | null
          expire_at: string | null
          match_id: number
          player_id: string
          rating: number
          ready: boolean
          team: number | null
          updated_at: string
        }
        Insert: {
          captain?: boolean
          connected_at?: string | null
          expire_at?: string | null
          match_id: number
          player_id: string
          rating?: number
          ready?: boolean
          team?: number | null
          updated_at?: string
        }
        Update: {
          captain?: boolean
          connected_at?: string | null
          expire_at?: string | null
          match_id?: number
          player_id?: string
          rating?: number
          ready?: boolean
          team?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_team_fkey"
            columns: ["team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
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
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_team_fkey"
            columns: ["team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_servers: {
        Row: {
          created_at: string
          id: number
          server: string
        }
        Insert: {
          created_at?: string
          id: number
          server: string
        }
        Update: {
          created_at?: string
          id?: number
          server?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_servers_active_server_fkey"
            columns: ["server"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["ip"]
          },
          {
            foreignKeyName: "match_servers_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_team: number
          closed_at: string | null
          config: number
          created_at: string
          events: string[]
          home_team: number
          id: number
          live_at: string | null
          ready_at: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          away_team?: number
          closed_at?: string | null
          config: number
          created_at?: string
          events?: string[]
          home_team?: number
          id?: number
          live_at?: string | null
          ready_at?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          away_team?: number
          closed_at?: string | null
          config?: number
          created_at?: string
          events?: string[]
          home_team?: number
          id?: number
          live_at?: string | null
          ready_at?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_fkey"
            columns: ["away_team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_config_fkey"
            columns: ["config"]
            isOneToOne: false
            referencedRelation: "match_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_fkey"
            columns: ["home_team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_ratings: {
        Row: {
          config: number
          created_at: string
          player_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          config: number
          created_at?: string
          player_id: string
          rating?: number
          updated_at?: string
        }
        Update: {
          config?: number
          created_at?: string
          player_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_ratings_config_fkey"
            columns: ["config"]
            isOneToOne: false
            referencedRelation: "match_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_ratings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_url: string
          beta_tester: boolean
          created_at: string
          id: string
          keyhash: string | null
          nick: string
          teamspeak_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url: string
          beta_tester?: boolean
          created_at?: string
          id: string
          keyhash?: string | null
          nick: string
          teamspeak_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string
          beta_tester?: boolean
          created_at?: string
          id?: string
          keyhash?: string | null
          nick?: string
          teamspeak_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      players_duplicate: {
        Row: {
          avatar_url: string | null
          beta_tester: boolean | null
          created_at: string | null
          id: string | null
          keyhash: string | null
          nick: string | null
          teamspeak_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          beta_tester?: boolean | null
          created_at?: string | null
          id?: string | null
          keyhash?: string | null
          nick?: string | null
          teamspeak_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          beta_tester?: boolean | null
          created_at?: string | null
          id?: string | null
          keyhash?: string | null
          nick?: string | null
          teamspeak_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rounds: {
        Row: {
          created_at: string
          id: number
          info: Json
          map: number
          match: number | null
          server: string | null
          team1: number
          team1_tickets: string
          team2: number
          team2_tickets: string
        }
        Insert: {
          created_at?: string
          id?: number
          info: Json
          map: number
          match?: number | null
          server?: string | null
          team1?: number
          team1_tickets: string
          team2?: number
          team2_tickets: string
        }
        Update: {
          created_at?: string
          id?: number
          info?: Json
          map?: number
          match?: number | null
          server?: string | null
          team1?: number
          team1_tickets?: string
          team2?: number
          team2_tickets?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_map_fkey"
            columns: ["map"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_match_fkey"
            columns: ["match"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_server_fkey"
            columns: ["server"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["ip"]
          },
          {
            foreignKeyName: "rounds_team1_fkey"
            columns: ["team1"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_team2_fkey"
            columns: ["team2"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
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
            isOneToOne: true
            referencedRelation: "servers"
            referencedColumns: ["ip"]
          },
        ]
      }
      servers: {
        Row: {
          created_at: string
          demos_path: string | null
          ip: string
          name: string
          port: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          demos_path?: string | null
          ip: string
          name: string
          port?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          demos_path?: string | null
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
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar: string | null
          created_at: string
          discord_role: string | null
          id: number
          name: string
          owner: string
          visible: boolean
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          discord_role?: string | null
          id?: number
          name: string
          owner: string
          visible?: boolean
        }
        Update: {
          avatar?: string | null
          created_at?: string
          discord_role?: string | null
          id?: number
          name?: string
          owner?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      test_matched_clients: {
        Row: {
          last_connected: string | null
          manual_match: string | null
          player_id: string | null
          player_nick: string | null
          similarity_score: number | null
          teamspeak_id: string
          ts3_username: string | null
        }
        Insert: {
          last_connected?: string | null
          manual_match?: string | null
          player_id?: string | null
          player_nick?: string | null
          similarity_score?: number | null
          teamspeak_id: string
          ts3_username?: string | null
        }
        Update: {
          last_connected?: string | null
          manual_match?: string | null
          player_id?: string | null
          player_nick?: string | null
          similarity_score?: number | null
          teamspeak_id?: string
          ts3_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_id_fk"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      ts3_uid_clients_import: {
        Row: {
          "Last Connected Date": string | null
          "Unique Identifier": string
          Username: string | null
        }
        Insert: {
          "Last Connected Date"?: string | null
          "Unique Identifier": string
          Username?: string | null
        }
        Update: {
          "Last Connected Date"?: string | null
          "Unique Identifier"?: string
          Username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      match_type: "Mix" | "PCW" | "League" | "Cup" | "Ladder"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
