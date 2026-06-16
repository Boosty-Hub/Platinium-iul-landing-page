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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          data: Json
          id: string
          occurred_at: string
          path: string
          session_id: string
          type: string
          visitor_id: string
        }
        Insert: {
          data?: Json
          id?: string
          occurred_at?: string
          path: string
          session_id: string
          type: string
          visitor_id: string
        }
        Update: {
          data?: Json
          id?: string
          occurred_at?: string
          path?: string
          session_id?: string
          type?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_pageviews: {
        Row: {
          active_time_ms: number
          id: string
          max_scroll_pct: number
          path: string
          session_id: string
          viewed_at: string
          visitor_id: string
        }
        Insert: {
          active_time_ms?: number
          id: string
          max_scroll_pct?: number
          path: string
          session_id: string
          viewed_at?: string
          visitor_id: string
        }
        Update: {
          active_time_ms?: number
          id?: string
          max_scroll_pct?: number
          path?: string
          session_id?: string
          viewed_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_pageviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          entry_path: string
          id: string
          ip_anon: string | null
          last_seen_at: string
          referrer: string | null
          started_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string
        }
        Insert: {
          entry_path?: string
          id: string
          ip_anon?: string | null
          last_seen_at?: string
          referrer?: string | null
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id: string
        }
        Update: {
          entry_path?: string
          id?: string
          ip_anon?: string | null
          last_seen_at?: string
          referrer?: string | null
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ahorro_semanal: string | null
          anio_nacimiento: number | null
          city: string | null
          created_at: string
          email: string
          fbclid: string | null
          fuente: string | null
          gclid: string | null
          genero: string | null
          id: string
          interes: string | null
          ip_address: string | null
          kommo_lead_id: string | null
          kommo_synced: boolean | null
          nombre: string
          notas: string | null
          referrer: string | null
          region: string | null
          telefono: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ahorro_semanal?: string | null
          anio_nacimiento?: number | null
          city?: string | null
          created_at?: string
          email: string
          fbclid?: string | null
          fuente?: string | null
          gclid?: string | null
          genero?: string | null
          id?: string
          interes?: string | null
          ip_address?: string | null
          kommo_lead_id?: string | null
          kommo_synced?: boolean | null
          nombre: string
          notas?: string | null
          referrer?: string | null
          region?: string | null
          telefono: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ahorro_semanal?: string | null
          anio_nacimiento?: number | null
          city?: string | null
          created_at?: string
          email?: string
          fbclid?: string | null
          fuente?: string | null
          gclid?: string | null
          genero?: string | null
          id?: string
          interes?: string | null
          ip_address?: string | null
          kommo_lead_id?: string | null
          kommo_synced?: boolean | null
          nombre?: string
          notas?: string | null
          referrer?: string | null
          region?: string | null
          telefono?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_click_heatmap: {
        Args: { p_from?: string; p_path?: string; p_to?: string }
        Returns: {
          value: number
          x: number
          y: number
        }[]
      }
      analytics_known_paths: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          pageviews: number
          path: string
        }[]
      }
      analytics_scroll_distribution: {
        Args: { p_from?: string; p_path?: string; p_to?: string }
        Returns: {
          pct: number
          pct_reached: number
          sessions_reached: number
        }[]
      }
      analytics_section_attention: {
        Args: { p_from?: string; p_path?: string; p_to?: string }
        Returns: {
          appearances: number
          avg_active_ms: number
          section: string
        }[]
      }
      analytics_session_stats: {
        Args: { p_from?: string; p_path?: string; p_to?: string }
        Returns: Json
      }
      analytics_upsert_pageview: {
        Args: {
          p_active_ms: number
          p_id: string
          p_path: string
          p_scroll_pct: number
          p_session_id: string
          p_visitor_id: string
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
