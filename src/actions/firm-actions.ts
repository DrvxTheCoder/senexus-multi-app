'use server'

import { createClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { ModuleUtils } from '@/types/modules'

export interface CreateFirmData {
  name: string
  type: string
  description?: string | null
  logo?: string | null
  theme_color: string
  selectedModules: string[]
}

export interface CreateFirmResult {
  success: boolean
  firmId?: string
  error?: string
}

/**
 * Create a new firm with selected modules
 */
export async function createFirmWithModules(firmData: CreateFirmData): Promise<CreateFirmResult> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Check if user has admin privileges
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Permissions insuffisantes pour créer une firme' }
    }

    // Get Senexus Group ID
    const { data: senexusGroup, error: groupError } = await supabase
      .from('senexus_groups')
      .select('id')
      .eq('name', 'Senexus Group')
      .single()

    if (groupError || !senexusGroup) {
      return { success: false, error: 'Groupe Senexus non trouvé' }
    }

    // Validate modules exist
    const { data: availableModules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .in('id', firmData.selectedModules)

    if (modulesError) {
      return { success: false, error: 'Erreur lors de la validation des modules' }
    }

    // Validate module dependencies
    for (const moduleId of firmData.selectedModules) {
      const mod = availableModules?.find(m => m.id === moduleId)
      if (mod && mod.requires_modules) {
        const validation = ModuleUtils.validateModuleInstallation(
          mod,
          availableModules?.filter(m => firmData.selectedModules.includes(m.id)).map(m => m.slug) || []
        )
        if (!validation.valid) {
          return { 
            success: false, 
            error: `Dépendances manquantes pour ${mod.display_name}: ${validation.errors.join(', ')}` 
          }
        }
      }
    }

    // Create the firm
    const { data: newFirm, error: firmError } = await supabase
      .from('firms')
      .insert({
        senexus_group_id: senexusGroup.id,
        name: firmData.name,
        type: firmData.type,
        description: firmData.description,
        logo: firmData.logo,
        theme_color: firmData.theme_color,
        is_active: true
      })
      .select()
      .single()

    if (firmError) {
      return { success: false, error: firmError.message }
    }

    // Enable selected modules for the firm
    const firmModulesData = firmData.selectedModules.map(moduleId => ({
      firm_id: newFirm.id,
      module_id: moduleId,
      is_enabled: true,
      enabled_at: new Date().toISOString(),
      enabled_by: user.id,
      configuration: {}
    }))

    const { error: modulesInsertError } = await supabase
      .from('firm_modules')
      .insert(firmModulesData)

    if (modulesInsertError) {
      // Rollback firm creation if module setup fails
      await supabase.from('firms').delete().eq('id', newFirm.id)
      return { success: false, error: 'Erreur lors de l\'activation des modules' }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')

    return { success: true, firmId: newFirm.id }
  } catch (error) {
    console.error('Error creating firm with modules:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Get all firms visible to the current user
 */
export async function getUserFirms() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { firms: [], error: 'Non autorisé' }
    }

    const { data: firms, error } = await supabase
      .from('firms')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      return { firms: [], error: error.message }
    }

    return { firms: firms || [] }
  } catch (error) {
    console.error('Error fetching user firms:', error)
    return { firms: [], error: 'Erreur lors du chargement des firmes' }
  }
}

/**
 * Update firm information
 */
export async function updateFirm(firmId: string, updateData: Partial<CreateFirmData>) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Check user permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, firm_id')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.firm_id !== firmId)) {
      return { success: false, error: 'Permissions insuffisantes' }
    }

    const { error } = await supabase
      .from('firms')
      .update({
        name: updateData.name,
        type: updateData.type,
        description: updateData.description,
        logo: updateData.logo,
        theme_color: updateData.theme_color,
        updated_at: new Date().toISOString()
      })
      .eq('id', firmId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')

    return { success: true }
  } catch (error) {
    console.error('Error updating firm:', error)
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

/**
 * Delete/deactivate a firm
 */
export async function deleteFirm(firmId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Only admins can delete firms
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Seuls les administrateurs peuvent supprimer des firmes' }
    }

    // Check if firm has active employees/contracts
    const { data: entities } = await supabase
      .from('entities')
      .select('id')
      .eq('firm_id', firmId)
      .eq('is_active', true)

    if (entities && entities.length > 0) {
      return { 
        success: false, 
        error: 'Impossible de supprimer une firme ayant des entités actives' 
      }
    }

    // Soft delete by marking as inactive
    const { error } = await supabase
      .from('firms')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', firmId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')

    return { success: true }
  } catch (error) {
    console.error('Error deleting firm:', error)
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}