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
      cuentas: {
        Row: {
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      estrategias: {
        Row: {
          anio: number
          concepto_creativo: string | null
          created_at: string
          dolor_necesidad: string | null
          id: string
          mensaje_rector: string | null
          mes: number
          objetivo_general: string | null
          objetivos_especificos: string | null
          segmento_principal: string | null
          segmento_secundario: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anio: number
          concepto_creativo?: string | null
          created_at?: string
          dolor_necesidad?: string | null
          id?: string
          mensaje_rector?: string | null
          mes: number
          objetivo_general?: string | null
          objetivos_especificos?: string | null
          segmento_principal?: string | null
          segmento_secundario?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anio?: number
          concepto_creativo?: string | null
          created_at?: string
          dolor_necesidad?: string | null
          id?: string
          mensaje_rector?: string | null
          mes?: number
          objetivo_general?: string | null
          objetivos_especificos?: string | null
          segmento_principal?: string | null
          segmento_secundario?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      publicaciones: {
        Row: {
          alcance: number | null
          campana: string | null
          clics: number | null
          color: string | null
          compartidos: number | null
          copy_arte: string | null
          copy_caption: string | null
          costo: number | null
          costo_por_resultado: number | null
          created_at: string
          cta_texto: string | null
          cuenta_id: string | null
          descripcion: string | null
          duracion: string | null
          engagement: number | null
          er_porcentaje: number | null
          estado: string
          etapa_funnel: string | null
          fecha: string
          guardados: number | null
          hashtags: string | null
          hook: string | null
          id: string
          impresiones: number | null
          indicaciones_arte: string | null
          link_referencia: string | null
          objetivo_post: string | null
          pilar_contenido: string | null
          presupuesto: number | null
          red_social: string
          referencia_visual: string | null
          segmentacion: string | null
          seguidores_nuevos: number | null
          tipo_contenido: string
          tipo_pauta: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alcance?: number | null
          campana?: string | null
          clics?: number | null
          color?: string | null
          compartidos?: number | null
          copy_arte?: string | null
          copy_caption?: string | null
          costo?: number | null
          costo_por_resultado?: number | null
          created_at?: string
          cta_texto?: string | null
          cuenta_id?: string | null
          descripcion?: string | null
          duracion?: string | null
          engagement?: number | null
          er_porcentaje?: number | null
          estado?: string
          etapa_funnel?: string | null
          fecha: string
          guardados?: number | null
          hashtags?: string | null
          hook?: string | null
          id?: string
          impresiones?: number | null
          indicaciones_arte?: string | null
          link_referencia?: string | null
          objetivo_post?: string | null
          pilar_contenido?: string | null
          presupuesto?: number | null
          red_social: string
          referencia_visual?: string | null
          segmentacion?: string | null
          seguidores_nuevos?: number | null
          tipo_contenido: string
          tipo_pauta?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alcance?: number | null
          campana?: string | null
          clics?: number | null
          color?: string | null
          compartidos?: number | null
          copy_arte?: string | null
          copy_caption?: string | null
          costo?: number | null
          costo_por_resultado?: number | null
          created_at?: string
          cta_texto?: string | null
          cuenta_id?: string | null
          descripcion?: string | null
          duracion?: string | null
          engagement?: number | null
          er_porcentaje?: number | null
          estado?: string
          etapa_funnel?: string | null
          fecha?: string
          guardados?: number | null
          hashtags?: string | null
          hook?: string | null
          id?: string
          impresiones?: number | null
          indicaciones_arte?: string | null
          link_referencia?: string | null
          objetivo_post?: string | null
          pilar_contenido?: string | null
          presupuesto?: number | null
          red_social?: string
          referencia_visual?: string | null
          segmentacion?: string | null
          seguidores_nuevos?: number | null
          tipo_contenido?: string
          tipo_pauta?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
