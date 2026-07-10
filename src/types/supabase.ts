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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      containers: {
        Row: {
          id: string
          display_id: string
          organisation_id: string
          name: string
          domain: string | null
          environment: "production" | "staging" | "sandbox"
          gtm_container_id: string | null
          ga4_property_id: string | null
          google_ads_conversion_id: string | null
          notes: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          display_id: string
          organisation_id: string
          name: string
          domain?: string | null
          environment?: "production" | "staging" | "sandbox"
          gtm_container_id?: string | null
          ga4_property_id?: string | null
          google_ads_conversion_id?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          display_id?: string
          organisation_id?: string
          name?: string
          domain?: string | null
          environment?: "production" | "staging" | "sandbox"
          gtm_container_id?: string | null
          ga4_property_id?: string | null
          google_ads_conversion_id?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          display_id: string
          container_id: string
          organisation_id: string
          name: string
          tag_type: "ga4_event" | "ga4_config" | "meta_pixel" | "floodlight" | "custom_html"
          status: "draft" | "active" | "paused" | "archived"
          priority: number
          parameters: Json
          notes: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          display_id: string
          container_id: string
          organisation_id: string
          name: string
          tag_type: "ga4_event" | "ga4_config" | "meta_pixel" | "floodlight" | "custom_html"
          status?: "draft" | "active" | "paused" | "archived"
          priority?: number
          parameters?: Json
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          display_id?: string
          container_id?: string
          organisation_id?: string
          name?: string
          tag_type?: "ga4_event" | "ga4_config" | "meta_pixel" | "floodlight" | "custom_html"
          status?: "draft" | "active" | "paused" | "archived"
          priority?: number
          parameters?: Json
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      triggers: {
        Row: {
          id: string
          display_id: string
          container_id: string
          organisation_id: string
          name: string
          trigger_type: "pageview" | "click" | "custom_event" | "form_submit" | "scroll" | "timer" | "history_change"
          event_name: string | null
          conditions: Json
          notes: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          display_id: string
          container_id: string
          organisation_id: string
          name: string
          trigger_type: "pageview" | "click" | "custom_event" | "form_submit" | "scroll" | "timer" | "history_change"
          event_name?: string | null
          conditions?: Json
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          display_id?: string
          container_id?: string
          organisation_id?: string
          name?: string
          trigger_type?: "pageview" | "click" | "custom_event" | "form_submit" | "scroll" | "timer" | "history_change"
          event_name?: string | null
          conditions?: Json
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      tag_triggers: {
        Row: {
          tag_id: string
          trigger_id: string
          relationship: "fires_on" | "blocks"
          created_at: string
        }
        Insert: {
          tag_id: string
          trigger_id: string
          relationship?: "fires_on" | "blocks"
          created_at?: string
        }
        Update: {
          tag_id?: string
          trigger_id?: string
          relationship?: "fires_on" | "blocks"
          created_at?: string
        }
        Relationships: []
      }
      variables: {
        Row: {
          id: string
          display_id: string
          container_id: string
          organisation_id: string
          name: string
          variable_type: "datalayer" | "constant" | "url" | "cookie" | "dom_element" | "custom_js"
          parameters: Json
          default_value: string | null
          notes: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          display_id: string
          container_id: string
          organisation_id: string
          name: string
          variable_type: "datalayer" | "constant" | "url" | "cookie" | "dom_element" | "custom_js"
          parameters?: Json
          default_value?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          display_id?: string
          container_id?: string
          organisation_id?: string
          name?: string
          variable_type?: "datalayer" | "constant" | "url" | "cookie" | "dom_element" | "custom_js"
          parameters?: Json
          default_value?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          id: string
          display_id: string
          container_id: string
          organisation_id: string
          event_name: string
          display_name: string | null
          value_param: string | null
          currency: string | null
          is_active: boolean
          conversion_label: string | null
          category: "purchase" | "add_to_cart" | "begin_checkout" | "subscribe" | "qualified_lead" | "converted_lead" | "submit_lead_form" | "book_appointment" | "sign_up" | "request_quote" | "get_directions" | "outbound_click" | "contact" | "page_view" | "other"
          notes: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          display_id: string
          container_id: string
          organisation_id: string
          event_name: string
          display_name?: string | null
          value_param?: string | null
          currency?: string | null
          is_active?: boolean
          conversion_label?: string | null
          category?: "purchase" | "add_to_cart" | "begin_checkout" | "subscribe" | "qualified_lead" | "converted_lead" | "submit_lead_form" | "book_appointment" | "sign_up" | "request_quote" | "get_directions" | "outbound_click" | "contact" | "page_view" | "other"
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          display_id?: string
          container_id?: string
          organisation_id?: string
          event_name?: string
          display_name?: string | null
          value_param?: string | null
          currency?: string | null
          is_active?: boolean
          conversion_label?: string | null
          category?: "purchase" | "add_to_cart" | "begin_checkout" | "subscribe" | "qualified_lead" | "converted_lead" | "submit_lead_form" | "book_appointment" | "sign_up" | "request_quote" | "get_directions" | "outbound_click" | "contact" | "page_view" | "other"
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
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
