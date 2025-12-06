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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chats: {
        Row: {
          analyzed_data: Json | null
          chat_content: string
          confidence_score: number | null
          created_at: string
          flags: string[] | null
          id: string
          intent: string | null
          tone: string | null
          user_id: string
        }
        Insert: {
          analyzed_data?: Json | null
          chat_content: string
          confidence_score?: number | null
          created_at?: string
          flags?: string[] | null
          id?: string
          intent?: string | null
          tone?: string | null
          user_id: string
        }
        Update: {
          analyzed_data?: Json | null
          chat_content?: string
          confidence_score?: number | null
          created_at?: string
          flags?: string[] | null
          id?: string
          intent?: string | null
          tone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_packs: {
        Row: {
          available_for: Database["public"]["Enums"]["subscription_tier"][]
          created_at: string
          credits: number
          id: string
          name: string
          price_cents: number
        }
        Insert: {
          available_for?: Database["public"]["Enums"]["subscription_tier"][]
          created_at?: string
          credits: number
          id?: string
          name: string
          price_cents: number
        }
        Update: {
          available_for?: Database["public"]["Enums"]["subscription_tier"][]
          created_at?: string
          credits?: number
          id?: string
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          action: Database["public"]["Enums"]["credit_action"]
          created_at: string
          credits_used: number
          description: string | null
          id: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["credit_action"]
          created_at?: string
          credits_used: number
          description?: string | null
          id?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["credit_action"]
          created_at?: string
          credits_used?: number
          description?: string | null
          id?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credits_remaining: number
          daily_credits: number
          email: string
          free_analyses_used: number
          id: string
          last_active_date: string | null
          last_credit_reset: string
          streak_days: number
          stripe_customer_id: string | null
          subscription_status: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          total_credits_used: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          daily_credits?: number
          email: string
          free_analyses_used?: number
          id: string
          last_active_date?: string | null
          last_credit_reset?: string
          streak_days?: number
          stripe_customer_id?: string | null
          subscription_status?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          total_credits_used?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          daily_credits?: number
          email?: string
          free_analyses_used?: number
          id?: string
          last_active_date?: string | null
          last_credit_reset?: string
          streak_days?: number
          stripe_customer_id?: string | null
          subscription_status?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          total_credits_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          saved_flag: boolean
          suggested_text: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          saved_flag?: boolean
          suggested_text: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          saved_flag?: boolean
          suggested_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          daily_credits: number
          features: Json | null
          id: string
          name: string
          price_cents: number
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string
          daily_credits: number
          features?: Json | null
          id?: string
          name: string
          price_cents: number
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string
          daily_credits?: number
          features?: Json | null
          id?: string
          name?: string
          price_cents?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_icon: string
          badge_name: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_icon: string
          badge_name: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_icon?: string
          badge_name?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_daily_credits: { Args: { p_user_id: string }; Returns: undefined }
      use_credits: {
        Args: {
          p_action: Database["public"]["Enums"]["credit_action"]
          p_credits: number
          p_description?: string
          p_tokens?: number
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      credit_action:
        | "short_chat"
        | "long_chat"
        | "image_analysis"
        | "daily_reset"
        | "credit_pack"
        | "rollover"
      subscription_tier: "free" | "pro" | "max" | "vip"
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
    Enums: {
      credit_action: [
        "short_chat",
        "long_chat",
        "image_analysis",
        "daily_reset",
        "credit_pack",
        "rollover",
      ],
      subscription_tier: ["free", "pro", "max", "vip"],
    },
  },
} as const
