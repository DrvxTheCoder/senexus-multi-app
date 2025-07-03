// src/lib/supabase/types.ts
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
      senexus_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firms_senexus_group_id_fkey"
            columns: ["id"]
            referencedRelation: "firms"
            referencedColumns: ["senexus_group_id"]
          }
        ]
      }
      firms: {
        Row: {
          id: string
          senexus_group_id: string
          name: string
          type: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          senexus_group_id: string
          name: string
          type: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          senexus_group_id?: string
          name?: string
          type?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firms_senexus_group_id_fkey"
            columns: ["senexus_group_id"]
            referencedRelation: "senexus_groups"
            referencedColumns: ["id"]
          }
        ]
      }
      entities: {
        Row: {
          id: string
          firm_id: string
          name: string
          industry: string | null
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          name: string
          industry?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          name?: string
          industry?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          clerk_user_id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          entity_id: string
          employee_number: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          national_id: string | null
          address: string | null
          position: string | null
          department: string | null
          hire_date: string
          status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entity_id: string
          employee_number: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          national_id?: string | null
          address?: string | null
          position?: string | null
          department?: string | null
          hire_date: string
          status?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          entity_id?: string
          employee_number?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          national_id?: string | null
          address?: string | null
          position?: string | null
          department?: string | null
          hire_date?: string
          status?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_entity_id_fkey"
            columns: ["entity_id"]
            referencedRelation: "entities"
            referencedColumns: ["id"]
          }
        ]
      }
      contracts: {
        Row: {
          id: string
          employee_id: string
          entity_id: string
          type: 'CDI' | 'CDD' | 'STAGIAIRE' | 'PRESTATAIRE'
          start_date: string
          end_date: string | null
          salary: number | null
          currency: string
          status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
          terms: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          entity_id: string
          type: 'CDI' | 'CDD' | 'STAGIAIRE' | 'PRESTATAIRE'
          start_date: string
          end_date?: string | null
          salary?: number | null
          currency?: string
          status?: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
          terms?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          entity_id?: string
          type?: 'CDI' | 'CDD' | 'STAGIAIRE' | 'PRESTATAIRE'
          start_date?: string
          end_date?: string | null
          salary?: number | null
          currency?: string
          status?: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
          terms?: string | null
          created_at?: string
          updated_at?: string
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
          }
        ]
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          scope: 'SYSTEM' | 'FIRM' | 'ENTITY'
          is_system_role: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          scope?: 'SYSTEM' | 'FIRM' | 'ENTITY'
          is_system_role?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          scope?: 'SYSTEM' | 'FIRM' | 'ENTITY'
          is_system_role?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          name: string
          resource: string
          action: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          resource: string
          action: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          resource?: string
          action?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          firm_id: string | null
          entity_id: string | null
          assigned_at: string
          expires_at: string | null
          assigned_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          firm_id?: string | null
          entity_id?: string | null
          assigned_at?: string
          expires_at?: string | null
          assigned_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          firm_id?: string | null
          entity_id?: string | null
          assigned_at?: string
          expires_at?: string | null
          assigned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_firm_id_fkey"
            columns: ["firm_id"]
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_entity_id_fkey"
            columns: ["entity_id"]
            referencedRelation: "entities"
            referencedColumns: ["id"]
          }
        ]
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          permission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          permission_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          entity_type: string
          entity_id: string
          action: string
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          entity_type: string
          entity_id: string
          action: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          entity_type?: string
          entity_id?: string
          action?: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
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
      contract_type: 'CDI' | 'CDD' | 'STAGIAIRE' | 'PRESTATAIRE'
      employee_status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED'
      contract_status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
      role_scope: 'SYSTEM' | 'FIRM' | 'ENTITY'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}