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
      buildings: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_group_members: {
        Row: {
          created_at: string
          document_id: string | null
          group_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          group_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          group_id?: string | null
          id?: string
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
          category: string
          created_at: string
          description: string | null
          equipment_ids: string[] | null
          fileurl: string | null
          id: string
          title: string
          updatedat: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          equipment_ids?: string[] | null
          fileurl?: string | null
          id?: string
          title: string
          updatedat?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          equipment_ids?: string[] | null
          fileurl?: string | null
          id?: string
          title?: string
          updatedat?: string
        }
        Relationships: []
      }
      equipment_group_members: {
        Row: {
          created_at: string
          equipment_id: string | null
          group_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          group_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          group_id?: string | null
          id?: string
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
          id: string
          name: string
          shared_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          shared_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          shared_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipments: {
        Row: {
          building_id: string | null
          created_at: string
          date_mise_en_service: string | null
          description: string | null
          health_percentage: number | null
          id: string
          image_url: string | null
          inventory_number: string | null
          loan_status: boolean
          location_id: string | null
          manufacturer: string | null
          model: string | null
          name: string
          purchase_date: string | null
          relationships: Json | null
          serial_number: string | null
          service_id: string | null
          status: string
          supplier: string | null
          tag_number: string | null
          uf: string | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          date_mise_en_service?: string | null
          description?: string | null
          health_percentage?: number | null
          id?: string
          image_url?: string | null
          inventory_number?: string | null
          loan_status?: boolean
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          purchase_date?: string | null
          relationships?: Json | null
          serial_number?: string | null
          service_id?: string | null
          status?: string
          supplier?: string | null
          tag_number?: string | null
          uf?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          building_id?: string | null
          created_at?: string
          date_mise_en_service?: string | null
          description?: string | null
          health_percentage?: number | null
          id?: string
          image_url?: string | null
          inventory_number?: string | null
          loan_status?: boolean
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          purchase_date?: string | null
          relationships?: Json | null
          serial_number?: string | null
          service_id?: string | null
          status?: string
          supplier?: string | null
          tag_number?: string | null
          uf?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      interventions: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          end_date: string | null
          equipment_id: string | null
          id: string
          priority: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          equipment_id?: string | null
          id?: string
          priority?: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          equipment_id?: string | null
          id?: string
          priority?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
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
      part_group_members: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          part_id: string | null
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          part_id?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          part_id?: string | null
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
          created_at: string
          description: string | null
          id: string
          name: string
          quantity: number | null
          reference: string | null
          supplier: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          quantity?: number | null
          reference?: string | null
          supplier?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          quantity?: number | null
          reference?: string | null
          supplier?: string | null
          unit_price?: number | null
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
      ufs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          contact_info: string | null
          created_at: string
          full_name: string
          id: string
          password: string
          role: string
          specialization: string | null
          updated_at: string
          username: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          full_name: string
          id?: string
          password: string
          role: string
          specialization?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          full_name?: string
          id?: string
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
