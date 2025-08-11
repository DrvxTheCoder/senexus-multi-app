// src/hooks/useUserPermissions.ts
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import {
  getUserSession,
  isUserAdmin,
  getUserAssignedFirmIds,
  userHasAccessToFirm
} from '@/lib/auth/session-cookies';

export interface UserPermissions {
  // Role-based permissions
  isAdmin: boolean;
  isOwner: boolean;
  isManager: boolean;
  isAuditor: boolean;
  isUser: boolean;

  // Firm access
  assignedFirmIds: string[];
  primaryFirmId: string | null;
  hasAccessToFirm: (firmId: string) => boolean;
  canAccessAllFirms: boolean;

  // Action permissions
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canCreateFirms: boolean;
  canEditFirms: boolean;
  canManageFirmAssignments: boolean;
  canViewAllUsers: boolean;
  canViewUserDetails: boolean;

  // Session data
  userId: string | null;
  userRole: string | null;
  fullName: string | null;
}

/**
 * Hook to get user permissions and access controls
 * Uses both auth context and cookie session data
 */
export const useUserPermissions = (): UserPermissions => {
  const { user, profile, userSession } = useAuth();

  return useMemo(() => {
    // Get session data from context or cookie
    const sessionData = userSession || getUserSession();
    const role = profile?.role || sessionData?.role || 'user';

    // Role-based permissions
    const isAdmin = role === 'admin';
    const isOwner = role === 'owner';
    const isManager = role === 'manager';
    const isAuditor = role === 'audit';
    const isUserRole = role === 'user';

    // High-level access
    const canAccessAllFirms = isAdmin || isOwner;
    const assignedFirmIds = sessionData?.assignedFirmIds || [];
    const primaryFirmId =
      sessionData?.primaryFirmId || profile?.firm_id || null;

    // Firm access function
    const hasAccessToFirm = (firmId: string): boolean => {
      if (canAccessAllFirms) return true;
      return assignedFirmIds.includes(firmId);
    };

    // Action permissions based on role
    const canCreateUsers = isAdmin || isOwner;
    const canEditUsers = isAdmin || isOwner || isManager;
    const canDeleteUsers = isAdmin || isOwner;
    const canCreateFirms = isAdmin || isOwner;
    const canEditFirms = isAdmin || isOwner;
    const canManageFirmAssignments = isAdmin || isOwner;
    const canViewAllUsers = isAdmin || isOwner || isManager;
    const canViewUserDetails = isAdmin || isOwner || isManager || isAuditor;

    return {
      // Role checks
      isAdmin,
      isOwner,
      isManager,
      isAuditor,
      isUser: isUserRole,

      // Firm access
      assignedFirmIds,
      primaryFirmId,
      hasAccessToFirm,
      canAccessAllFirms,

      // Action permissions
      canCreateUsers,
      canEditUsers,
      canDeleteUsers,
      canCreateFirms,
      canEditFirms,
      canManageFirmAssignments,
      canViewAllUsers,
      canViewUserDetails,

      // Session data
      userId: user?.id || null,
      userRole: role,
      fullName: profile?.full_name || sessionData?.fullName || null
    };
  }, [user, profile, userSession]);
};

/**
 * Hook to check if user can access a specific firm
 */
export const useCanAccessFirm = (firmId: string | null): boolean => {
  const { hasAccessToFirm } = useUserPermissions();

  return useMemo(() => {
    if (!firmId) return false;
    return hasAccessToFirm(firmId);
  }, [firmId, hasAccessToFirm]);
};

/**
 * Hook to get filtered data based on user firm access
 */
export const useFilteredByFirmAccess = <T extends { firm_id?: string }>(
  data: T[]
): T[] => {
  const { canAccessAllFirms, assignedFirmIds } = useUserPermissions();

  return useMemo(() => {
    if (canAccessAllFirms) {
      return data;
    }

    return data.filter((item) => {
      if (!item.firm_id) return false;
      return assignedFirmIds.includes(item.firm_id);
    });
  }, [data, canAccessAllFirms, assignedFirmIds]);
};

/**
 * Component wrapper for role-based access control
 */
interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'owner' | 'manager' | 'audit' | 'user')[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, otherwise ANY role
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null,
  requireAll = false
}) => {
  const permissions = useUserPermissions();

  const hasAccess = useMemo(() => {
    const roleChecks = {
      admin: permissions.isAdmin,
      owner: permissions.isOwner,
      manager: permissions.isManager,
      audit: permissions.isAuditor,
      user: permissions.isUser
    };

    if (requireAll) {
      return allowedRoles.every((role) => roleChecks[role]);
    } else {
      return allowedRoles.some((role) => roleChecks[role]);
    }
  }, [allowedRoles, permissions, requireAll]);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Component wrapper for firm-based access control
 */
interface FirmGuardProps {
  children: React.ReactNode;
  firmId: string;
  fallback?: React.ReactNode;
}

export const FirmGuard: React.FC<FirmGuardProps> = ({
  children,
  firmId,
  fallback = null
}) => {
  const canAccess = useCanAccessFirm(firmId);

  return canAccess ? <>{children}</> : <>{fallback}</>;
};

export default useUserPermissions;
