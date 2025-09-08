// File: src/lib/auth/user-firm-utils.ts
import { createServerComponentClient } from '@/lib/supabase/server';

export interface UserFirmData {
  userId: string;
  role: string;
  assignedFirmIds: string[];
  primaryFirmId: string | null;
  defaultFirmSlug: string | null;
  canAccessAllFirms: boolean;
}

export interface FirmAccess {
  id: string;
  slug: string;
  codename: string;
  name: string;
  type: string | null;
  description: string | null;
  logo: string | null;
  theme_color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  senexus_group_id: string;
}

/**
 * Get user's firm access data server-side
 * This function determines which firms a user can access and their default firm
 */
export async function getUserFirmAccess(userId: string): Promise<UserFirmData | null> {
  try {
    const supabase = createServerComponentClient();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, firm_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    const isAdmin = profile.role === 'admin' || profile.role === 'owner';
    
    // If admin, get all firms
    if (isAdmin) {
      const { data: allFirms, error: firmsError } = await supabase
        .from('firms')
        .select('id, slug')
        .eq('is_active', true)
        .order('name');

      if (firmsError) {
        console.error('Error fetching all firms for admin:', firmsError);
        return null;
      }

      // For admins, default to first firm or primary firm
      const assignedFirmIds = allFirms?.map(f => f.id) || [];
      const defaultFirmSlug = allFirms?.[0]?.slug || null;

      return {
        userId,
        role: profile.role,
        assignedFirmIds,
        primaryFirmId: profile.firm_id,
        defaultFirmSlug,
        canAccessAllFirms: true
      };
    }

    // For regular users, get assigned firms
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_firm_assignments')
      .select('firm_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (assignmentsError) {
      console.error('Error fetching user assignments:', assignmentsError);
      
      // Fallback to primary firm if assignments table has issues
      if (profile.firm_id) {
        const { data: primaryFirm } = await supabase
          .from('firms')
          .select('id, slug')
          .eq('id', profile.firm_id)
          .eq('is_active', true)
          .single();

        if (primaryFirm) {
          return {
            userId,
            role: profile.role,
            assignedFirmIds: [primaryFirm.id],
            primaryFirmId: profile.firm_id,
            defaultFirmSlug: primaryFirm.slug,
            canAccessAllFirms: false
          };
        }
      }
      return null;
    }

    const assignedFirmIds = assignments?.map(a => a.firm_id) || [];
    
    // Include primary firm if not already in assignments
    if (profile.firm_id && !assignedFirmIds.includes(profile.firm_id)) {
      assignedFirmIds.push(profile.firm_id);
    }

    // Get firm details for slug determination
    let defaultFirmSlug: string | null = null;
    
    if (assignedFirmIds.length > 0) {
      // Get firm slugs for assigned firms
      const { data: firmSlugs, error: slugError } = await supabase
        .from('firms')
        .select('id, slug')
        .in('id', assignedFirmIds)
        .eq('is_active', true);

      if (!slugError && firmSlugs) {
        // Try primary firm first
        if (profile.firm_id) {
          const primaryFirm = firmSlugs.find(f => f.id === profile.firm_id);
          if (primaryFirm) {
            defaultFirmSlug = primaryFirm.slug;
          }
        }
        
        // Fallback to first assigned firm
        if (!defaultFirmSlug && firmSlugs.length > 0) {
          defaultFirmSlug = firmSlugs[0].slug;
        }
      }
    }

    return {
      userId,
      role: profile.role,
      assignedFirmIds,
      primaryFirmId: profile.firm_id,
      defaultFirmSlug,
      canAccessAllFirms: false
    };
  } catch (error) {
    console.error('Error getting user firm access:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific firm
 */
export async function checkUserFirmAccess(userId: string, firmSlug: string): Promise<boolean> {
  try {
    const supabase = createServerComponentClient();

    // Get firm by slug
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id')
      .eq('slug', firmSlug)
      .eq('is_active', true)
      .single();

    if (firmError || !firm) {
      return false;
    }

    // Get user access data
    const userAccess = await getUserFirmAccess(userId);
    if (!userAccess) {
      return false;
    }

    // Check if user can access this firm
    return userAccess.assignedFirmIds.includes(firm.id);
  } catch (error) {
    console.error('Error checking user firm access:', error);
    return false;
  }
}

/**
 * Get firm details by slug
 */
export async function getFirmBySlug(slug: string): Promise<FirmAccess | null> {
  try {
    const supabase = createServerComponentClient();
    
    const { data: firm, error } = await supabase
      .from('firms')
      .select('id, slug, codename, name, type, description, logo, theme_color, is_active, created_at, updated_at, senexus_group_id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !firm) {
      return null;
    }

    return firm;
  } catch (error) {
    console.error('Error getting firm by slug:', error);
    return null;
  }
}

/**
 * Get user's accessible firms with details
 */
export async function getUserAccessibleFirms(userId: string): Promise<FirmAccess[]> {
  try {
    const userAccess = await getUserFirmAccess(userId);
    if (!userAccess || userAccess.assignedFirmIds.length === 0) {
      return [];
    }

    const supabase = createServerComponentClient();
    
    const { data: firms, error } = await supabase
      .from('firms')
      .select('id, slug, codename, name, type, description, logo, theme_color, is_active, created_at, updated_at, senexus_group_id')
      .in('id', userAccess.assignedFirmIds)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching accessible firms:', error);
      return [];
    }

    return firms || [];
  } catch (error) {
    console.error('Error getting user accessible firms:', error);
    return [];
  }
}