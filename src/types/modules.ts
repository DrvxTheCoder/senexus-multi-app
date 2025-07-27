// Fixed Module System TypeScript Types and Utilities
// File: src/types/modules.ts

import { Database } from '@/lib/supabase/types'

// Base types from database
export type Module = Database['public']['Tables']['modules']['Row']
export type ModuleInsert = Database['public']['Tables']['modules']['Insert']
export type ModuleUpdate = Database['public']['Tables']['modules']['Update']

export type FirmModule = Database['public']['Tables']['firm_modules']['Row']
export type FirmModuleInsert = Database['public']['Tables']['firm_modules']['Insert']
export type FirmModuleUpdate = Database['public']['Tables']['firm_modules']['Update']

export type ModulePermission = Database['public']['Tables']['module_permissions']['Row']
export type ModulePermissionInsert = Database['public']['Tables']['module_permissions']['Insert']
export type ModulePermissionUpdate = Database['public']['Tables']['module_permissions']['Update']

// Enum types for better type safety
export type ModuleCategory = 'core' | 'business' | 'health' | 'communication' | 'analytics'
export type PricingTier = 'free' | 'basic' | 'premium' | 'enterprise'
export type PermissionScope = 'global' | 'firm' | 'entity' | 'self'
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'sign' | 'generate' | 'approve' | 'process' | 'manage'

// Available module slugs (keep in sync with database)
export type ModuleSlug = 
  | 'dashboard'
  | 'settings'
  | 'hr'
  | 'finance'
  | 'procurement'
  | 'projects'
  | 'health_insurance'
  | 'claims'
  | 'providers'
  | 'crm'
  | 'documents'
  | 'reports'
  | 'analytics'

// Extended types with related data
export interface ModuleWithStatus extends Module {
  is_enabled?: boolean
  enabled_at?: string | null
  configuration?: Record<string, any>
  permissions?: ModulePermission[]
  dependencies_met?: boolean
  conflicts?: string[]
}

export interface FirmModuleWithDetails extends FirmModule {
  module?: Module
  enabled_by_user?: {
    id: string
    full_name?: string
    email: string
  }
  disabled_by_user?: {
    id: string
    full_name?: string
    email: string
  }
}

export interface ModuleWithPermissions extends Module {
  permissions: ModulePermission[]
  user_permissions?: string[] // Permissions the current user has for this module
}

// Configuration types for different modules
export interface HRModuleConfig {
  auto_generate_employee_numbers: boolean
  default_contract_type: 'CDI' | 'CDD' | 'Stage' | 'Prestataire'
  probation_period_days: number
  notice_period_days: number
  working_hours_per_week: number
  annual_leave_days: number
  sick_leave_tracking: boolean
  contract_renewal_alerts: boolean
  contract_expiry_warning_days: number[]
}

export interface HealthInsuranceModuleConfig {
  coverage_types: string[]
  claim_approval_workflow: boolean
  auto_reimbursement_limit: number
  provider_network_required: boolean
  family_coverage_enabled: boolean
  copayment_percentages: Record<string, number>
}

export interface FinanceModuleConfig {
  default_currency: string
  tax_rates: Record<string, number>
  invoice_numbering_format: string
  payment_terms_days: number
  late_payment_interest_rate: number
  multi_currency_enabled: boolean
}

export interface CRMModuleConfig {
  lead_stages: string[]
  sales_pipeline_enabled: boolean
  auto_follow_up_days: number
  email_integration_enabled: boolean
  sms_notifications_enabled: boolean
}

// Union type for all module configurations
export type ModuleConfiguration = 
  | HRModuleConfig 
  | HealthInsuranceModuleConfig 
  | FinanceModuleConfig 
  | CRMModuleConfig 
  | Record<string, any>

// Form types for module management
export interface EnableModuleForm {
  module_id: string
  firm_id: string
  configuration?: ModuleConfiguration
}

export interface UpdateModuleConfigForm {
  firm_module_id: string
  configuration: ModuleConfiguration
}

// Navigation and routing types
export interface ModuleNavigation {
  slug: ModuleSlug
  label: string
  href: string
  icon: string
  color?: string
  badge?: string | number
  children?: ModuleNavigation[]
}

export interface ModuleDashboardWidget {
  id: string
  module_slug: ModuleSlug
  title: string
  type: 'stats' | 'chart' | 'list' | 'table'
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number; w: number; h: number }
  configuration: any
  permissions_required: string[]
}

// Module dependency and conflict resolution
export interface ModuleDependency {
  module_slug: ModuleSlug
  required_modules: ModuleSlug[]
  conflicting_modules: ModuleSlug[]
  optional_modules: ModuleSlug[]
}

export interface ModuleValidationResult {
  valid: boolean
  missing_dependencies: ModuleSlug[]
  conflicting_modules: ModuleSlug[]
  warnings: string[]
  errors: string[]
}

// Utility functions for module management
export class ModuleUtils {
  /**
   * Check if a module is enabled for a firm
   */
  static isModuleEnabled(firmModules: FirmModule[], moduleSlug: ModuleSlug): boolean {
    return firmModules.some(fm => 
      (fm as any).module?.slug === moduleSlug && fm.is_enabled
    )
  }

  /**
   * Get enabled modules for a firm
   */
  static getEnabledModules(firmModules: FirmModuleWithDetails[]): Module[] {
    return firmModules
      .filter(fm => fm.is_enabled && fm.module)
      .map(fm => fm.module!)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }

  /**
   * Check if user has permission for a module action
   */
  static hasPermission(
    userPermissions: string[], 
    moduleSlug: ModuleSlug, 
    action: PermissionAction, 
    resource?: string
  ): boolean {
    const permissionKey = resource 
      ? `${moduleSlug}.${resource}.${action}`
      : `${moduleSlug}.${action}`
    
    return userPermissions.includes('admin') || userPermissions.includes(permissionKey)
  }

  /**
   * Validate module dependencies and conflicts
   */
  static validateModuleInstallation(
    moduleToInstall: Module,
    currentlyEnabled: ModuleSlug[]
  ): ModuleValidationResult {
    const result: ModuleValidationResult = {
      valid: true,
      missing_dependencies: [],
      conflicting_modules: [],
      warnings: [],
      errors: []
    }

    // Check dependencies
    if (moduleToInstall.requires_modules) {
      for (const required of moduleToInstall.requires_modules) {
        if (!currentlyEnabled.includes(required as ModuleSlug)) {
          result.missing_dependencies.push(required as ModuleSlug)
          result.valid = false
        }
      }
    }

    // Check conflicts
    if (moduleToInstall.conflicts_with) {
      for (const conflicting of moduleToInstall.conflicts_with) {
        if (currentlyEnabled.includes(conflicting as ModuleSlug)) {
          result.conflicting_modules.push(conflicting as ModuleSlug)
          result.valid = false
        }
      }
    }

    // Add error messages
    if (result.missing_dependencies.length > 0) {
      result.errors.push(
        `Modules requis manquants: ${result.missing_dependencies.join(', ')}`
      )
    }

    if (result.conflicting_modules.length > 0) {
      result.errors.push(
        `Conflit avec les modules activés: ${result.conflicting_modules.join(', ')}`
      )
    }

    return result
  }

  /**
   * Get module configuration with defaults
   */
  static getModuleConfig<T extends ModuleConfiguration>(
    firmModule: FirmModule,
    defaultConfig: T
  ): T {
    if (!firmModule.configuration || typeof firmModule.configuration !== 'object') {
      return defaultConfig
    }

    return {
      ...defaultConfig,
      ...(firmModule.configuration as Record<string, any>)
    } as T
  }

  /**
   * Get default configuration for a module
   */
  static getDefaultConfig(moduleSlug: ModuleSlug): ModuleConfiguration {
    switch (moduleSlug) {
      case 'hr':
        return {
          auto_generate_employee_numbers: true,
          default_contract_type: 'CDI',
          probation_period_days: 90,
          notice_period_days: 30,
          working_hours_per_week: 35,
          annual_leave_days: 25,
          sick_leave_tracking: true,
          contract_renewal_alerts: true,
          contract_expiry_warning_days: [90, 60, 30, 15]
        } as HRModuleConfig

      case 'health_insurance':
        return {
          coverage_types: ['Base', 'Complémentaire', 'Dentaire', 'Optique'],
          claim_approval_workflow: true,
          auto_reimbursement_limit: 100,
          provider_network_required: false,
          family_coverage_enabled: true,
          copayment_percentages: {
            'consultation': 70,
            'medication': 80,
            'hospitalization': 90,
            'dental': 60,
            'optical': 50
          }
        } as HealthInsuranceModuleConfig

      case 'finance':
        return {
          default_currency: 'EUR',
          tax_rates: { 'TVA': 20, 'TVA_Reduced': 10 },
          invoice_numbering_format: 'FAC-{YYYY}-{###}',
          payment_terms_days: 30,
          late_payment_interest_rate: 0.03,
          multi_currency_enabled: false
        } as FinanceModuleConfig

      case 'crm':
        return {
          lead_stages: ['Prospect', 'Qualifié', 'Proposition', 'Négociation', 'Gagné', 'Perdu'],
          sales_pipeline_enabled: true,
          auto_follow_up_days: 7,
          email_integration_enabled: true,
          sms_notifications_enabled: false
        } as CRMModuleConfig

      default:
        return {}
    }
  }
}

// Constants for commonly used values
export const MODULE_CATEGORIES: Record<ModuleCategory, { label: string; color: string }> = {
  core: { label: 'Système', color: '#6b7280' },
  business: { label: 'Business', color: '#3b82f6' },
  health: { label: 'Santé', color: '#ef4444' },
  communication: { label: 'Communication', color: '#f59e0b' },
  analytics: { label: 'Analytiques', color: '#8b5cf6' }
}

export const PRICING_TIERS: Record<PricingTier, { label: string; color: string }> = {
  free: { label: 'Gratuit', color: '#10b981' },
  basic: { label: 'Basique', color: '#3b82f6' },
  premium: { label: 'Premium', color: '#f59e0b' },
  enterprise: { label: 'Entreprise', color: '#8b5cf6' }
}

export const CORE_MODULES: ModuleSlug[] = ['dashboard', 'settings']

export const BUSINESS_MODULES: ModuleSlug[] = ['hr', 'finance', 'procurement', 'projects']

export const HEALTH_MODULES: ModuleSlug[] = ['health_insurance', 'claims', 'providers']

export const COMMUNICATION_MODULES: ModuleSlug[] = ['crm', 'documents']

export const ANALYTICS_MODULES: ModuleSlug[] = ['reports', 'analytics']