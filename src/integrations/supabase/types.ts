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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      buildings: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_group_members: {
        Row: {
          created_at: string | null
          document_id: string
          group_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          group_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          group_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_group_members_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "equipment_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          createdat: string | null
          description: string | null
          equipment_ids: string[] | null
          filename: string | null
          filetype: string | null
          fileurl: string | null
          group_ids: string[] | null
          id: string
          size: number | null
          tags: string[] | null
          title: string
          updatedat: string | null
        }
        Insert: {
          category?: string | null
          createdat?: string | null
          equipment_ids?: string[] | null
          filename?: string | null
          filetype?: string | null
          fileurl?: string | null
          group_ids?: string[] | null
          id?: string
          size?: number | null
          tags?: string[] | null
          title: string
          updatedat?: string | null
        }
        Update: {
          category?: string | null
          createdat?: string | null
          equipment_ids?: string[] | null
          filename?: string | null
          filetype?: string | null
          fileurl?: string | null
          group_ids?: string[] | null
          id?: string
          size?: number | null
          tags?: string[] | null
          title?: string
          updatedat?: string | null
        }
        Relationships: []
      }
      equipment_group_members: {
        Row: {
          created_at: string | null
          equipment_id: string
          group_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          group_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          group_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_group_members_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "equipment_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_groups: {
        Row: {
          created_at: string
          description: string | null
          equipment_group_ids: string[] | null
          id: string
          name: string
          shared_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_group_ids?: string[] | null
          id?: string
          name: string
          shared_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_group_ids?: string[] | null
          id?: string
          name?: string
          shared_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          equipment_id: string
          field_name: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          equipment_id: string
          field_name: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          equipment_id?: string
          field_name?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      equipments: {
        Row: {
          building_id: string | null
          created_at: string | null
          date_mise_en_service: string | null
          equipment_group_ids: string[] | null
          health_percentage: number | null
          healthpercentage: number | null
          id: string
          image_url: string | null
          imageurl: string | null
          inventory_number: string | null
          location_id: string | null
          manufacturer: string | null
          model: string | null
          modified_at: string | null
          modified_by: string | null
          name: string
          purchase_date: string | null
          relationships: Json | null
          serial_number: string | null
          service_id: string | null
          status: string | null
          supplier: string | null
          uf: string | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          building_id?: string | null
          created_at?: string | null
          date_mise_en_service?: string | null
          equipment_group_ids?: string[] | null
          health_percentage?: number | null
          healthpercentage?: number | null
          id?: string
          image_url?: string | null
          imageurl?: string | null
          inventory_number?: string | null
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          modified_at?: string | null
          modified_by?: string | null
          name: string
          purchase_date?: string | null
          relationships?: Json | null
          serial_number?: string | null
          service_id?: string | null
          status?: string | null
          supplier?: string | null
          uf?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          building_id?: string | null
          created_at?: string | null
          date_mise_en_service?: string | null
          equipment_group_ids?: string[] | null
          health_percentage?: number | null
          healthpercentage?: number | null
          id?: string
          image_url?: string | null
          imageurl?: string | null
          inventory_number?: string | null
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          modified_at?: string | null
          modified_by?: string | null
          name?: string
          purchase_date?: string | null
          relationships?: Json | null
          serial_number?: string | null
          service_id?: string | null
          status?: string | null
          supplier?: string | null
          uf?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipments_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          actions: string | null
          completed_date: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          equipment_id: string | null
          id: string
          maintenance_id: string | null
          parts: Json | null
          priority: string | null
          scheduled_date: string
          start_date: string | null
          status: string | null
          technician_history: Json | null
          technicians: string[] | null
          title: string | null
          type: string
        }
        Insert: {
          actions?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          equipment_id?: string | null
          id?: string
          maintenance_id?: string | null
          parts?: Json | null
          priority?: string | null
          scheduled_date: string
          start_date?: string | null
          status?: string | null
          technician_history?: Json | null
          technicians?: string[] | null
          title?: string | null
          type: string
        }
        Update: {
          actions?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          equipment_id?: string | null
          id?: string
          maintenance_id?: string | null
          parts?: Json | null
          priority?: string | null
          scheduled_date?: string
          start_date?: string | null
          status?: string | null
          technician_history?: Json | null
          technicians?: string[] | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_maintenance"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "maintenances"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
          service_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenances: {
        Row: {
          assigned_technicians: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          equipment_id: string | null
          equipment_name: string | null
          frequency_type: string
          frequency_value: number | null
          id: string
          last_completed_date: string | null
          next_due_date: string
          notes: string | null
          notification_enabled: boolean | null
          notification_time_before_unit: string | null
          notification_time_before_value: number | null
          priority: string
          selected_dates: Json | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_technicians?: string[] | null
          created_at?: string | null
          created_by?: string | null
          equipment_id?: string | null
          equipment_name?: string | null
          frequency_type?: string
          frequency_value?: number | null
          id?: string
          last_completed_date?: string | null
          next_due_date: string
          notes?: string | null
          notification_enabled?: boolean | null
          notification_time_before_unit?: string | null
          notification_time_before_value?: number | null
          priority?: string
          selected_dates?: Json | null
          status?: string
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          assigned_technicians?: string[] | null
          created_at?: string | null
          created_by?: string | null
          equipment_id?: string | null
          equipment_name?: string | null
          frequency_type?: string
          frequency_value?: number | null
          id?: string
          last_completed_date?: string | null
          next_due_date?: string
          notes?: string | null
          notification_enabled?: boolean | null
          notification_time_before_unit?: string | null
          notification_time_before_value?: number | null
          priority?: string
          selected_dates?: Json | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenances_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          intervention_id: string | null
          maintenance_id: string | null
          message: string
          metadata: Json | null
          recipient_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intervention_id?: string | null
          maintenance_id?: string | null
          message: string
          metadata?: Json | null
          recipient_id?: string | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intervention_id?: string | null
          maintenance_id?: string | null
          message?: string
          metadata?: Json | null
          recipient_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "maintenances"
            referencedColumns: ["id"]
          },
        ]
      }
      part_group_members: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          part_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          part_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          part_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "equipment_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_group_members_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          equipment_ids: string[] | null
          group_ids: string[] | null
          id: string
          image: string | null
          last_restock_date: string | null
          location: string | null
          min_quantity: number
          name: string
          price: number | null
          quantity: number
          reference: string
          supplier: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          equipment_ids?: string[] | null
          group_ids?: string[] | null
          id?: string
          image?: string | null
          last_restock_date?: string | null
          location?: string | null
          min_quantity?: number
          name: string
          price?: number | null
          quantity?: number
          reference: string
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          equipment_ids?: string[] | null
          group_ids?: string[] | null
          id?: string
          image?: string | null
          last_restock_date?: string | null
          location?: string | null
          min_quantity?: number
          name?: string
          price?: number | null
          quantity?: number
          reference?: string
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          building_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          avatar_url: string | null
          certifications: Json | null
          contact_info: string | null
          created_at: string
          id: string
          name: string
          role: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          certifications?: Json | null
          contact_info?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          certifications?: Json | null
          contact_info?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ufs: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          is_read: boolean
          persistent: boolean
          priority: string
          recipients: Json | null
          reminder_time: number | null
          scheduled_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          is_read?: boolean
          persistent?: boolean
          priority?: string
          recipients?: Json | null
          reminder_time?: number | null
          scheduled_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          is_read?: boolean
          persistent?: boolean
          priority?: string
          recipients?: Json | null
          reminder_time?: number | null
          scheduled_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          contact_info: string | null
          created_at: string
          dark_mode: boolean | null
          full_name: string
          id: string
          menu_preferences: Json
          password: string
          role: string
          specialization: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          contact_info?: string | null
          created_at?: string
          dark_mode?: boolean | null
          full_name: string
          id?: string
          menu_preferences?: Json
          password: string
          role?: string
          specialization?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          contact_info?: string | null
          created_at?: string
          dark_mode?: boolean | null
          full_name?: string
          id?: string
          menu_preferences?: Json
          password?: string
          role?: string
          specialization?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_due_date: {
        Args: { freq_type: string; freq_value?: number; last_date: string }
        Returns: string
      }
      is_recipient: {
        Args: {
          original_user_id: string
          recipients_list: Json
          user_id_check: string
        }
        Returns: boolean
      }
      log_equipment_change: {
        Args: {
          p_changed_by?: string
          p_equipment_id: string
          p_field_name: string
          p_new_value?: Json
          p_old_value?: Json
        }
        Returns: undefined
      }
      update_equipment_group_relations_after_tables_exist: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_technician_history: {
        Args: { history: Json }
        Returns: boolean
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
