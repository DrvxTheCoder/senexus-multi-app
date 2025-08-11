// src/lib/auth/session-cookies.ts
'use client';

import { createClient } from '@/lib/supabase/client';

export interface UserSessionData {
  userId: string;
  role: string;
  assignedFirmIds: string[];
  primaryFirmId: string | null;
  fullName: string | null;
  lastUpdated: number;
}

const USER_SESSION_COOKIE = 'user_session_data';
const COOKIE_EXPIRY_DAYS = 7; // 7 days

// Cookie utilities
const setCookie = (
  name: string,
  value: string,
  days: number = COOKIE_EXPIRY_DAYS
) => {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure=${window.location.protocol === 'https:'}`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const nameEQ = name + '=';
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
};

// Store user session data in cookie
export const storeUserSession = (sessionData: UserSessionData): void => {
  try {
    const sessionWithTimestamp = {
      ...sessionData,
      lastUpdated: Date.now()
    };

    const encoded = btoa(JSON.stringify(sessionWithTimestamp));
    setCookie(USER_SESSION_COOKIE, encoded);

    console.log(
      'User session stored:',
      sessionData.userId,
      sessionData.assignedFirmIds.length + ' firms'
    );
  } catch (error) {
    console.error('Error storing user session:', error);
  }
};

// Retrieve user session data from cookie
export const getUserSession = (): UserSessionData | null => {
  try {
    const encoded = getCookie(USER_SESSION_COOKIE);
    if (!encoded) return null;

    const decoded = JSON.parse(atob(encoded));

    // Check if data is stale (older than 24 hours)
    const now = Date.now();
    const dataAge = now - (decoded.lastUpdated || 0);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (dataAge > maxAge) {
      console.log('User session data is stale, clearing...');
      clearUserSession();
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Error retrieving user session:', error);
    clearUserSession(); // Clear corrupted data
    return null;
  }
};

// Clear user session data
export const clearUserSession = (): void => {
  deleteCookie(USER_SESSION_COOKIE);
  console.log('User session cleared');
};

// Fetch and store user firm assignments
export const fetchAndStoreUserSession = async (
  userId: string
): Promise<UserSessionData | null> => {
  try {
    const supabase = createClient();

    console.log('Fetching user session data for:', userId);

    // Get user profile with firm assignments
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, firm_id, full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // Get user's firm assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_firm_assignments')
      .select('firm_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (assignmentsError) {
      console.error('Error fetching user assignments:', assignmentsError);
      // If assignments table doesn't exist or has issues, fall back to primary firm only
      if (profile.firm_id) {
        const sessionData: UserSessionData = {
          userId,
          role: profile.role || 'user',
          assignedFirmIds: [profile.firm_id],
          primaryFirmId: profile.firm_id,
          fullName: profile.full_name,
          lastUpdated: Date.now()
        };

        storeUserSession(sessionData);
        return sessionData;
      }
      return null;
    }

    const assignedFirmIds = assignments?.map((a) => a.firm_id) || [];

    // Include primary firm if not already in assignments
    if (profile.firm_id && !assignedFirmIds.includes(profile.firm_id)) {
      assignedFirmIds.push(profile.firm_id);
    }

    const sessionData: UserSessionData = {
      userId,
      role: profile.role || 'user',
      assignedFirmIds,
      primaryFirmId: profile.firm_id,
      fullName: profile.full_name,
      lastUpdated: Date.now()
    };

    storeUserSession(sessionData);
    console.log(
      `User session updated: ${assignedFirmIds.length} firms assigned`
    );

    return sessionData;
  } catch (error) {
    console.error('Error fetching and storing user session:', error);
    return null;
  }
};

// Check if user has access to a specific firm
export const userHasAccessToFirm = (firmId: string): boolean => {
  const session = getUserSession();
  if (!session) return false;

  return session.assignedFirmIds.includes(firmId);
};

// Get user's assigned firm IDs
export const getUserAssignedFirmIds = (): string[] => {
  const session = getUserSession();
  return session?.assignedFirmIds || [];
};

// Check if user has admin role
export const isUserAdmin = (): boolean => {
  const session = getUserSession();
  return session?.role === 'admin' || session?.role === 'owner';
};
