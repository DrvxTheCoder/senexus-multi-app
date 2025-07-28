'use server';

import { createServerComponentClient as createClient } from '@/lib/supabase/server';

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  position?: string;
  department?: string;
  role: string;
  hire_date?: string;
  is_active: boolean;
  assigned_firms: string[];
  created_by: string;
}

export async function createUser(userData: CreateUserData) {
  try {
    const supabase = createClient();

    // Step 1: Create user with service role (server-side)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role
      },
      email_confirm: true // Auto-confirm for admin-created users
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    // Step 2: Create/update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name || null,
        phone: userData.phone || null,
        position: userData.position || null,
        department: userData.department || null,
        role: userData.role,
        hire_date: userData.hire_date || null,
        is_active: userData.is_active
      }, {
        onConflict: 'id'
      });

    if (profileError) throw profileError;

    // Step 3: Create firm assignments
    if (userData.assigned_firms.length > 0) {
      const assignments = userData.assigned_firms.map(firmId => ({
        user_id: authData.user!.id,
        firm_id: firmId,
        assigned_by: userData.created_by,
        is_active: true
      }));

      const { error: assignmentError } = await supabase
        .from('user_firm_assignments')
        .insert(assignments);

      if (assignmentError) throw assignmentError;
    }

    return {
      success: true,
      user: authData.user
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deactivateUser(userId: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deactivating user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function activateUser(userId: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error activating user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function assignUserToFirm(userId: string, firmId: string, assignedBy: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('user_firm_assignments')
      .insert({
        user_id: userId,
        firm_id: firmId,
        assigned_by: assignedBy
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error assigning user to firm:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function removeUserFromFirm(userId: string, firmId: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('user_firm_assignments')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('firm_id', firmId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing user from firm:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getUserWithAssignments(userId: string) {
  try {
    const supabase = createClient();
    
    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select(`
        *,
        primary_firm:firm_id(id, name, logo, theme_color)
      `)
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get user's firm assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_firm_assignments_view')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (assignmentsError) throw assignmentsError;

    return {
      success: true,
      user: {
        ...user,
        assigned_firms: assignments?.map(assignment => ({
          id: assignment.firm_id,
          name: assignment.firm_name,
          logo: assignment.firm_logo,
          theme_color: assignment.firm_theme_color
        })) || []
      }
    };
  } catch (error) {
    console.error('Error getting user with assignments:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function updateUserLastLogin(userId: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        last_login_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating last login:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getUsersWithFirmAssignments() {
  try {
    const supabase = createClient();
    
    // Get all users with their primary firm info
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        *,
        primary_firm:firm_id(id, name, logo, theme_color)
      `)
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Get all firm assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_firm_assignments_view')
      .select('*')
      .eq('is_active', true);

    if (assignmentsError) throw assignmentsError;

    // Combine the data
    const enrichedUsers = (users || []).map(user => {
      const userAssignments = assignments?.filter(assignment => 
        assignment.user_id === user.id
      ) || [];

      return {
        ...user,
        assigned_firms: userAssignments.map(assignment => ({
          id: assignment.firm_id,
          name: assignment.firm_name,
          logo: assignment.firm_logo,
          theme_color: assignment.firm_theme_color
        }))
      };
    });

    return {
      success: true,
      users: enrichedUsers
    };
  } catch (error) {
    console.error('Error getting users with assignments:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}