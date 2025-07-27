export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: { p_usename: string }
        Returns: {
          username: string
          password: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contract_alerts: {
        Row: {
          alert_date: string
          alert_type: string
          contract_id: string
          created_at: string | null
          days_before: number
          id: string
          is_sent: boolean | null
          message: string | null
          recipient_email: string | null
          sent_at: string | null
        }
        Insert: {
          alert_date: string
          alert_type: string
          contract_id: string
          created_at?: string | null
          days_before?: number
          id?: string
          is_sent?: boolean | null
          message?: string | null
          recipient_email?: string | null
          sent_at?: string | null
        }
        Update: {
          alert_date?: string
          alert_type?: string
          contract_id?: string
          created_at?: string | null
          days_before?: number
          id?: string
          is_sent?: boolean | null
          message?: string | null
          recipient_email?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_alerts_contract_id_fkey"
            columns: ["contract_id"]
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          benefits: string | null
          contract_number: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          department: string | null
          employee_id: string
          end_date: string | null
          entity_id: string
          id: string
          notes: string | null
          notice_period_days: number | null
          renewal_date: string | null
          reporting_manager: string | null
          salary_frequency: string | null
          salary_gross: number | null
          salary_net: number | null
          signed_by_employee: boolean | null
          signed_by_employer: boolean | null
          signed_date: string | null
          start_date: string
          status: string | null
          terms: string | null
          title: string
          type: Database["public"]["Enums"]["contract_type"]
          updated_at: string | null
          working_hours_per_week: number | null
          workplace_address: string | null
        }
        Insert: {
          benefits?: string | null
          contract_number: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          employee_id: string
          end_date?: string | null
          entity_id: string
          id?: string
          notes?: string | null
          notice_period_days?: number | null
          renewal_date?: string | null
          reporting_manager?: string | null
          salary_frequency?: string | null
          salary_gross?: number | null
          salary_net?: number | null
          signed_by_employee?: boolean | null
          signed_by_employer?: boolean | null
          signed_date?: string | null
          start_date: string
          status?: string | null
          terms?: string | null
          title: string
          type: Database["public"]["Enums"]["contract_type"]
          updated_at?: string | null
          working_hours_per_week?: number | null
          workplace_address?: string | null
        }
        Update: {
          benefits?: string | null
          contract_number?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          employee_id?: string
          end_date?: string | null
          entity_id?: string
          id?: string
          notes?: string | null
          notice_period_days?: number | null
          renewal_date?: string | null
          reporting_manager?: string | null
          salary_frequency?: string | null
          salary_gross?: number | null
          salary_net?: number | null
          signed_by_employee?: boolean | null
          signed_by_employer?: boolean | null
          signed_date?: string | null
          start_date?: string
          status?: string | null
          terms?: string | null
          title?: string
          type?: Database["public"]["Enums"]["contract_type"]
          updated_at?: string | null
          working_hours_per_week?: number | null
          workplace_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_entity_id_fkey"
            columns: ["entity_id"]
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account_bic: string | null
          bank_account_iban: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_number: string
          entity_id: string
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          national_id: string | null
          nationality: string | null
          phone: string | null
          place_of_birth: string | null
          position: string | null
          postal_code: string | null
          social_security_number: string | null
          status: string | null
          termination_date: string | null
          termination_reason: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bank_account_bic?: string | null
          bank_account_iban?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_number: string
          entity_id: string
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          national_id?: string | null
          nationality?: string | null
          phone?: string | null
          place_of_birth?: string | null
          position?: string | null
          postal_code?: string | null
          social_security_number?: string | null
          status?: string | null
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bank_account_bic?: string | null
          bank_account_iban?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_number?: string
          entity_id?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          national_id?: string | null
          nationality?: string | null
          phone?: string | null
          place_of_birth?: string | null
          position?: string | null
          postal_code?: string | null
          social_security_number?: string | null
          status?: string | null
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_entity_id_fkey"
            columns: ["entity_id"]
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          firm_id: string
          id: string
          industry: string | null
          is_active: boolean | null
          name: string
          postal_code: string | null
          siret: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          firm_id: string
          id?: string
          industry?: string | null
          is_active?: boolean | null
          name: string
          postal_code?: string | null
          siret?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          firm_id?: string
          id?: string
          industry?: string | null
          is_active?: boolean | null
          name?: string
          postal_code?: string | null
          siret?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_modules: {
        Row: {
          configuration: Json | null
          created_at: string | null
          disabled_at: string | null
          disabled_by: string | null
          enabled_at: string | null
          enabled_by: string | null
          firm_id: string
          id: string
          is_enabled: boolean | null
          module_id: string
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          firm_id: string
          id?: string
          is_enabled?: boolean | null
          module_id: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          disabled_at?: string | null
          disabled_by?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          firm_id?: string
          id?: string
          is_enabled?: boolean | null
          module_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "firm_modules_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_modules_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          senexus_group_id: string
          theme_color: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          senexus_group_id: string
          theme_color?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          senexus_group_id?: string
          theme_color?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "firms_senexus_group_id_fkey"
            columns: ["senexus_group_id"]
            referencedRelation: "senexus_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          action: string | null
          created_at: string | null
          description: string | null
          id: string
          module_id: string
          name: string
          resource: string | null
          scope: string | null
          slug: string
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          module_id: string
          name: string
          resource?: string | null
          scope?: string | null
          slug: string
        }
        Update: {
          action?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string
          name?: string
          resource?: string | null
          scope?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          category: string | null
          color: string | null
          conflicts_with: string[] | null
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_core: boolean | null
          name: string
          pricing_tier: string | null
          requires_modules: string[] | null
          slug: string
          sort_order: number | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          conflicts_with?: string[] | null
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_core?: boolean | null
          name: string
          pricing_tier?: string | null
          requires_modules?: string[] | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          conflicts_with?: string[] | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_core?: boolean | null
          name?: string
          pricing_tier?: string | null
          requires_modules?: string[] | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          firm_id: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          firm_id?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          firm_id?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      role_module_permissions: {
        Row: {
          created_at: string | null
          firm_id: string
          granted_by: string | null
          id: string
          module_permission_id: string
          role_name: string
        }
        Insert: {
          created_at?: string | null
          firm_id: string
          granted_by?: string | null
          id?: string
          module_permission_id: string
          role_name: string
        }
        Update: {
          created_at?: string | null
          firm_id?: string
          granted_by?: string | null
          id?: string
          module_permission_id?: string
          role_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_module_permissions_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_module_permissions_module_permission_id_fkey"
            columns: ["module_permission_id"]
            referencedRelation: "module_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      senexus_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile: {
        Args: {
          user_id: string
          email_param: string
          full_name_param?: string
          org_id_param?: string
          org_role_param?: string
        }
        Returns: undefined
      }
      generate_contract_number: {
        Args: { entity_uuid: string }
        Returns: string
      }
      generate_employee_number: {
        Args: { entity_uuid: string }
        Returns: string
      }
    }
    Enums: {
      contract_type:
        | "CDI"
        | "CDD"
        | "Stage"
        | "Prestataire"
        | "Freelance"
        | "Interim"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  pgbouncer: {
    Enums: {},
  },
  public: {
    Enums: {
      contract_type: [
        "CDI",
        "CDD",
        "Stage",
        "Prestataire",
        "Freelance",
        "Interim",
      ],
    },
  },
  storage: {
    Enums: {},
  },
} as const
