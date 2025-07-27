'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ModuleWithStatus, 
  ModuleSlug
} from '@/types/modules'
import { 
  getFirmModules, 
  toggleFirmModule, 
  updateModuleConfiguration,
  getUserModulePermissions 
} from '@/actions/module-actions'

/**
 * Hook for managing firm modules
 */
export function useFirmModules(firmId: string) {
  const [modules, setModules] = useState<ModuleWithStatus[]>([])
  const [enabledModules, setEnabledModules] = useState<ModuleSlug[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadModules = useCallback(async () => {
    if (!firmId) return

    setLoading(true)
    setError(null)

    try {
      const [modulesResult, permissionsResult] = await Promise.all([
        getFirmModules(firmId),
        getUserModulePermissions(firmId)
      ])

      if (modulesResult.error) {
        setError(modulesResult.error)
      } else {
        setModules(modulesResult.modules)
        setEnabledModules(modulesResult.enabledModules)
      }

      if (permissionsResult.error) {
        // Optionally handle error
      } else {
        setPermissions(permissionsResult.permissions)
      }
    } catch (err) {
      setError('Erreur lors du chargement des modules')
      // Optionally handle error
    } finally {
      setLoading(false)
    }
  }, [firmId])

  const toggleModule = useCallback(async (moduleId: string, enabled: boolean) => {
    const result = await toggleFirmModule(firmId, moduleId, enabled)
    if (result.success) {
      await loadModules() // Reload modules after change
    }
    return result
  }, [firmId, loadModules])

  const configureModule = useCallback(async (moduleId: string, configuration: any) => {
    const result = await updateModuleConfiguration(firmId, moduleId, configuration)
    if (result.success) {
      await loadModules() // Reload modules after change
    }
    return result
  }, [firmId, loadModules])

  const hasPermission = useCallback((permission: string) => {
    return permissions.includes('admin') || permissions.includes(permission)
  }, [permissions])

  const isModuleEnabled = useCallback((moduleSlug: ModuleSlug) => {
    return enabledModules.includes(moduleSlug)
  }, [enabledModules])

  const getModuleConfig = useCallback((moduleSlug: ModuleSlug) => {
    const mod = modules.find(m => m.slug === moduleSlug)
    return mod?.configuration || {}
  }, [modules])

  useEffect(() => {
    loadModules()
  }, [loadModules])

  return {
    modules,
    enabledModules,
    permissions,
    loading,
    error,
    toggleModule,
    configureModule,
    hasPermission,
    isModuleEnabled,
    getModuleConfig,
    reload: loadModules
  }
}

/**
 * Hook for current firm context
 */
export function useCurrentFirm() {
  const [firmId, setFirmId] = useState<string | null>(null)
  const [firmName, setFirmName] = useState<string>('')

  useEffect(() => {
    // Get firm from cookie or context
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null
      const nameEQ = name + '='
      const ca = document.cookie.split(';')
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
      }
      return null
    }

    const savedFirmId = getCookie('selectedFirmId')
    if (savedFirmId) {
      setFirmId(savedFirmId)
      // You might want to fetch firm details here
    }
  }, [])

  return { firmId, firmName, setFirmId }
}

/**
 * Module navigation generator
 */
export function useModuleNavigation(enabledModules: ModuleSlug[], permissions: string[]) {
  return useMemo(() => {
    const navigation = []

    // Dashboard (always available)
    if (enabledModules.includes('dashboard')) {
      navigation.push({
        slug: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        children: []
      })
    }

    // HR Module
    if (enabledModules.includes('hr')) {
      const hrChildren = []
      
      if (permissions.includes('admin') || permissions.includes('hr.entities.read')) {
        hrChildren.push({
          slug: 'hr',
          label: 'Entités',
          href: '/dashboard/hr/entities',
          icon: 'Building2'
        })
      }

      if (permissions.includes('admin') || permissions.includes('hr.employees.read')) {
        hrChildren.push({
          slug: 'hr',
          label: 'Employés',
          href: '/dashboard/hr/employees',
          icon: 'Users'
        })
      }

      if (permissions.includes('admin') || permissions.includes('hr.contracts.read')) {
        hrChildren.push({
          slug: 'hr',
          label: 'Contrats',
          href: '/dashboard/hr/contracts',
          icon: 'FileText'
        })
      }

      navigation.push({
        slug: 'hr',
        label: 'Ressources Humaines',
        href: '/dashboard/hr',
        icon: 'Users',
        children: hrChildren
      })
    }

    // Health Insurance Module
    if (enabledModules.includes('health_insurance')) {
      const healthChildren = []

      if (permissions.includes('admin') || permissions.includes('health_insurance.claims.read')) {
        healthChildren.push({
          slug: 'health_insurance',
          label: 'Demandes',
          href: '/dashboard/health/claims',
          icon: 'FileText'
        })
      }

      if (permissions.includes('admin') || permissions.includes('health_insurance.providers.read')) {
        healthChildren.push({
          slug: 'health_insurance',
          label: 'Prestataires',
          href: '/dashboard/health/providers',
          icon: 'Building2'
        })
      }

      navigation.push({
        slug: 'health_insurance',
        label: 'Assurance Santé',
        href: '/dashboard/health',
        icon: 'Heart',
        children: healthChildren
      })
    }

    // Finance Module
    if (enabledModules.includes('finance')) {
      navigation.push({
        slug: 'finance',
        label: 'Finance',
        href: '/dashboard/finance',
        icon: 'DollarSign',
        children: []
      })
    }

    // Settings (admin only)
    if (permissions.includes('admin')) {
      navigation.push({
        slug: 'settings',
        label: 'Paramètres',
        href: '/dashboard/settings',
        icon: 'Settings',
        children: [
          {
            slug: 'settings',
            label: 'Modules',
            href: '/dashboard/settings/modules',
            icon: 'Package'
          },
          {
            slug: 'settings',
            label: 'Utilisateurs',
            href: '/dashboard/settings/users',
            icon: 'Users'
          }
        ]
      })
    }

    return navigation
  }, [enabledModules, permissions])
}

/**
 * Module feature flags hook
 */
export function useModuleFeatures(firmId: string, moduleSlug: ModuleSlug) {
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeatures = async () => {
      if (!firmId || !moduleSlug) return

      try {
        const supabase = createClient()
        const { data: firmModule } = await supabase
          .from('firm_modules')
          .select(`
            configuration,
            module:modules!inner(slug)
          `)
          .eq('firm_id', firmId)
          .eq('module.slug', moduleSlug)
          .eq('is_enabled', true)
          .single()

        if (firmModule?.configuration) {
          // Extract feature flags from configuration
          const config = firmModule.configuration as Record<string, any>
          const moduleFeatures: Record<string, boolean> = {}

          // HR Module features
          if (moduleSlug === 'hr') {
            moduleFeatures.auto_employee_numbers = config.auto_generate_employee_numbers ?? true
            moduleFeatures.contract_alerts = config.contract_renewal_alerts ?? true
            moduleFeatures.sick_leave_tracking = config.sick_leave_tracking ?? true
          }

          // Health Insurance features
          if (moduleSlug === 'health_insurance') {
            moduleFeatures.family_coverage = config.family_coverage_enabled ?? true
            moduleFeatures.provider_network = config.provider_network_required ?? false
            moduleFeatures.claim_workflow = config.claim_approval_workflow ?? true
          }

          setFeatures(moduleFeatures)
        }
      } catch (error) {
        console.error('Error loading module features:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFeatures()
  }, [firmId, moduleSlug])

  return { features, loading }
}

/**
 * Utility functions for module management
 */
export const ModuleHelpers = {
  /**
   * Check if a feature is enabled for a module
   */
  isFeatureEnabled: (moduleConfig: any, featureName: string): boolean => {
    return moduleConfig?.[featureName] === true
  },

  /**
   * Get module theme color
   */
  getModuleColor: (module: ModuleWithStatus): string => {
    return module.color || '#3b82f6'
  },

  /**
   * Format module display name
   */
  formatModuleName: (module: ModuleWithStatus): string => {
    return module.display_name || module.name
  },

  /**
   * Check if module has dependencies
   */
  hasDependencies: (module: ModuleWithStatus): boolean => {
    return Array.isArray(module.requires_modules) && module.requires_modules.length > 0
  },

  /**
   * Get missing dependencies
   */
  getMissingDependencies: (module: ModuleWithStatus, enabledModules: ModuleSlug[]): string[] => {
    if (!module.requires_modules) return []
    return module.requires_modules.filter((req: any) => !enabledModules.includes(req as ModuleSlug))
  },

  /**
   * Sort modules by category and name
   */
  sortModules: (modules: ModuleWithStatus[]): ModuleWithStatus[] => {
    return modules.sort((a, b) => {
      // Core modules first
      if (a.is_core && !b.is_core) return -1
      if (!a.is_core && b.is_core) return 1
      
      // Then by category
      const categoryA = a.category || 'other'
      const categoryB = b.category || 'other'
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB)
      }
      
      // Finally by sort order and name
      const sortOrderA = a.sort_order || 999
      const sortOrderB = b.sort_order || 999
      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB
      }
      
      return a.display_name.localeCompare(b.display_name)
    })
  }
}