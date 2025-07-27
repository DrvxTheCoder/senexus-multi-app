'use server'

import { createClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { 
  ModuleWithStatus, 
  FirmModuleWithDetails, 
  ModuleSlug,
  ModuleConfiguration,
  ModuleUtils 
} from '@/types/modules'

/**
 * Get all available modules with their status for a firm
 */
export async function getFirmModules(firmId: string): Promise<{
  modules: ModuleWithStatus[]
  enabledModules: ModuleSlug[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get user and verify they belong to the firm
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { modules: [], enabledModules: [], error: 'Non autorisé' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.firm_id !== firmId && profile.role !== 'admin')) {
      return { modules: [], enabledModules: [], error: 'Accès refusé' }
    }

    // Get all modules with firm module status
    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        firm_modules!left(
          is_enabled,
          enabled_at,
          configuration,
          enabled_by,
          disabled_by
        )
      `)
      .eq('is_active', true)
      .eq('firm_modules.firm_id', firmId)
      .order('sort_order')

    if (modulesError) {
      return { modules: [], enabledModules: [], error: modulesError.message }
    }

    const modules: ModuleWithStatus[] = (modulesData || []).map((module: any) => ({
      ...module,
      is_enabled: module.firm_modules?.[0]?.is_enabled || false,
      enabled_at: module.firm_modules?.[0]?.enabled_at || null,
      configuration: (module.firm_modules?.[0]?.configuration as Record<string, any>) || {},
      dependencies_met: true,
      conflicts: [],
      // Ensure all required ModuleWithStatus fields are present
      category: module.category ?? '',
      color: module.color ?? '',
      conflicts_with: module.conflicts_with ?? [],
      created_at: module.created_at ?? null,
      description: module.description ?? '',
      display_name: module.display_name ?? '',
      icon: module.icon ?? '',
      id: module.id ?? '',
      is_active: module.is_active ?? false,
      is_core: module.is_core ?? false,
      requires_modules: module.requires_modules ?? [],
      slug: module.slug ?? '',
      sort_order: module.sort_order ?? 0,
      updated_at: module.updated_at ?? null,
      firm_modules: module.firm_modules ?? []
    }))

    const enabledModules: ModuleSlug[] = modules
      .filter(m => m.is_enabled)
      .map(m => m.slug as ModuleSlug)

    return { modules, enabledModules }
  } catch (error) {
    console.error('Error fetching firm modules:', error)
    return { 
      modules: [], 
      enabledModules: [], 
      error: 'Erreur lors du chargement des modules' 
    }
  }
}

/**
 * Enable or disable a module for a firm
 */
export async function toggleFirmModule(
  firmId: string, 
  moduleId: string, 
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get user and verify permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Non autorisé' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.firm_id !== firmId && profile.role !== 'admin')) {
      return { success: false, error: 'Permissions insuffisantes' }
    }

    // Get module details
    const { data: module } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single()

    if (!module) {
      return { success: false, error: 'Module non trouvé' }
    }

    // Prevent disabling core modules
    if (module.is_core && !enabled) {
      return { success: false, error: 'Les modules système ne peuvent pas être désactivés' }
    }

    if (enabled) {
      // Check dependencies before enabling
      const { data: enabledModulesData } = await supabase
        .from('firm_modules')
        .select(`
          module:modules!inner(slug)
        `)
        .eq('firm_id', firmId)
        .eq('is_enabled', true)

      const currentlyEnabled = (enabledModulesData || [])
        .map((fm: { module: any }) => (fm.module as any)?.slug as ModuleSlug)
        .filter(Boolean)

      const validation = ModuleUtils.validateModuleInstallation(module, currentlyEnabled)
      
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') }
      }

      // Enable module
      const { error } = await supabase
        .from('firm_modules')
        .upsert({
          firm_id: firmId,
          module_id: moduleId,
          is_enabled: true,
          enabled_at: new Date().toISOString(),
          enabled_by: user.id,
          configuration: ModuleUtils.getDefaultConfig(module.slug as ModuleSlug)
        })

      if (error) {
        return { success: false, error: error.message }
      }
    } else {
      // Check if other modules depend on this one
      const { data: dependentModules } = await supabase
        .from('modules')
        .select('id, display_name, requires_modules')
        .eq('is_active', true)

      const dependencies = (dependentModules || []).filter((m: { requires_modules: string | any[] }) => 
        m.requires_modules?.includes(module.slug)
      )

      if (dependencies.length > 0) {
        // Check if any dependent modules are enabled
        const { data: enabledDependents } = await supabase
          .from('firm_modules')
          .select(`
            module:modules!inner(display_name)
          `)
          .eq('firm_id', firmId)
          .eq('is_enabled', true)
          .in('module_id', dependencies.map((d: { id: any }) => d.id))

        if (enabledDependents && enabledDependents.length > 0) {
          const dependentNames = enabledDependents
            .map((ed: { module: any }) => (ed.module as any)?.display_name)
            .filter(Boolean)
            .join(', ')
          return { 
            success: false, 
            error: `Impossible de désactiver: requis par ${dependentNames}` 
          }
        }
      }

      // Disable module
      const { error } = await supabase
        .from('firm_modules')
        .update({
          is_enabled: false,
          disabled_at: new Date().toISOString(),
          disabled_by: user.id
        })
        .eq('firm_id', firmId)
        .eq('module_id', moduleId)

      if (error) {
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/dashboard/settings/modules')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error toggling module:', error)
    return { success: false, error: 'Erreur lors de la modification du module' }
  }
}

/**
 * Update module configuration for a firm
 */
export async function updateModuleConfiguration(
  firmId: string,
  moduleId: string,
  configuration: ModuleConfiguration
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get user and verify permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Non autorisé' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.firm_id !== firmId && !['admin', 'manager'].includes(profile.role || ''))) {
      return { success: false, error: 'Permissions insuffisantes' }
    }

    // Verify module is enabled for the firm
    const { data: firmModule } = await supabase
      .from('firm_modules')
      .select('*')
      .eq('firm_id', firmId)
      .eq('module_id', moduleId)
      .eq('is_enabled', true)
      .single()

    if (!firmModule) {
      return { success: false, error: 'Module non activé pour cette firme' }
    }

    // Update configuration
    const { error } = await supabase
      .from('firm_modules')
      .update({
        configuration,
        updated_at: new Date().toISOString()
      })
      .eq('firm_id', firmId)
      .eq('module_id', moduleId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/modules')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error updating module configuration:', error)
    return { success: false, error: 'Erreur lors de la mise à jour de la configuration' }
  }
}

/**
 * Get available modules for installation (marketplace view)
 */
export async function getAvailableModules(): Promise<{
  modules: ModuleWithStatus[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) {
      return { modules: [], error: error.message }
    }

    const modulesWithStatus: ModuleWithStatus[] = (modules || []).map((module: any) => ({
      ...module,
      is_enabled: false,
      dependencies_met: true,
      conflicts: []
    }))

    return { modules: modulesWithStatus }
  } catch (error) {
    console.error('Error fetching available modules:', error)
    return { modules: [], error: 'Erreur lors du chargement des modules disponibles' }
  }
}

/**
 * Get user permissions for modules
 */
export async function getUserModulePermissions(firmId: string): Promise<{
  permissions: string[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { permissions: [], error: 'Non autorisé' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { permissions: [], error: 'Profil non trouvé' }
    }

    // Get role-based permissions
    const { data: rolePermissions } = await supabase
      .from('role_module_permissions')
      .select(`
        module_permission:module_permissions!inner(
          slug,
          resource,
          action
        )
      `)
      .eq('role_name', profile.role)
      .eq('firm_id', firmId)

    const permissions = (rolePermissions || []).map((rp: { module_permission: any }) => {
      const perm = rp.module_permission as any
      return perm.resource 
        ? `${perm.slug}.${perm.resource}.${perm.action}`
        : `${perm.slug}.${perm.action}`
    })

    // Admins get all permissions
    if (profile.role === 'admin') {
      permissions.push('admin', 'settings.modules.manage')
    }

    return { permissions }
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return { permissions: [], error: 'Erreur lors du chargement des permissions' }
  }
}

/**
 * Install default modules for a new firm
 */
export async function installDefaultModules(firmId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Get core modules
    const { data: coreModules } = await supabase
      .from('modules')
      .select('*')
      .eq('is_core', true)
      .eq('is_active', true)

    if (!coreModules || coreModules.length === 0) {
      return { success: false, error: 'Aucun module système trouvé' }
    }

    // Install core modules
    const firmModulesData = coreModules.map((module: { id: any; slug: string }) => ({
      firm_id: firmId,
      module_id: module.id,
      is_enabled: true,
      enabled_at: new Date().toISOString(),
      enabled_by: user.id,
      configuration: ModuleUtils.getDefaultConfig(module.slug as ModuleSlug)
    }))

    const { error } = await supabase
      .from('firm_modules')
      .insert(firmModulesData)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error installing default modules:', error)
    return { success: false, error: 'Erreur lors de l\'installation des modules par défaut' }
  }
}

/**
 * Get module analytics/usage data
 */
export async function getModuleAnalytics(firmId: string, moduleSlug: ModuleSlug): Promise<{
  analytics: any
  error?: string
}> {
  try {
    // This would contain logic to gather analytics data
    // For now, return placeholder data
    const analytics = {
      usage_count: 0,
      last_used: null,
      popular_features: [],
      user_count: 0
    }

    return { analytics }
  } catch (error) {
    console.error('Error fetching module analytics:', error)
    return { analytics: {}, error: 'Erreur lors du chargement des statistiques' }
  }
}