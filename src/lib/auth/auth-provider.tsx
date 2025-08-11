// src/lib/auth/auth-provider.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import {
  storeUserSession,
  clearUserSession,
  fetchAndStoreUserSession,
  getUserSession,
  type UserSessionData
} from './session-cookies';

interface Profile {
  id: string;
  firm_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'owner' | 'audit' | 'manager' | 'user';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  userSession: UserSessionData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    metadata?: any,
    firmIds?: string[]
  ) => Promise<{ error: any; warning?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userSession, setUserSession] = useState<UserSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Track navigation to prevent unwanted redirects
  const isNavigating = useRef(false);
  const lastAuthAction = useRef<'signin' | 'signout' | 'init' | null>(null);
  const profileCache = useRef(new Map<string, Profile>());

  const fetchProfile = useCallback(
    async (userId: string, force = false): Promise<Profile | null> => {
      // Check cache first (unless force refresh)
      if (!force && profileCache.current.has(userId)) {
        return profileCache.current.get(userId) || null;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error || !data) {
          console.error('Error fetching profile:', error);
          return null;
        }

        // Cache the profile
        profileCache.current.set(userId, data);
        return data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
    },
    [supabase]
  );

  // Create profile with retry logic
  const createProfile = useCallback(
    async (user: User, retries = 3): Promise<Profile | null> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const profileData = {
            id: user.id,
            email: user.email!,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              null,
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'user' as const
          };

          const { data, error } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (error) {
            console.warn(`Profile creation attempt ${attempt} failed:`, error);
            if (attempt < retries) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * attempt)
              ); // Exponential backoff
              continue;
            }
            throw error;
          }

          // Update cache and return
          profileCache.current.set(user.id, data);
          console.log('Profile created successfully:', data.id);
          return data;
        } catch (error) {
          if (attempt === retries) {
            console.error('Profile creation failed after all retries:', error);
            return null;
          }
        }
      }
      return null;
    },
    [supabase]
  );

  // Refresh user session data
  const refreshUserSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      const sessionData = await fetchAndStoreUserSession(user.id);
      setUserSession(sessionData);
    } catch (error) {
      console.error('Error refreshing user session:', error);
    }
  }, [user?.id]);

  // Load user session from cookie on startup
  const loadUserSessionFromCookie = useCallback(() => {
    const sessionData = getUserSession();
    if (sessionData && user?.id === sessionData.userId) {
      setUserSession(sessionData);
      console.log(
        'User session loaded from cookie:',
        sessionData.assignedFirmIds.length + ' firms'
      );
    }
  }, [user?.id]);

  // Assign user to firms
  const assignUserToFirms = useCallback(
    async (userId: string, firmIds: string[]): Promise<void> => {
      if (!firmIds || firmIds.length === 0) {
        return;
      }

      // First verify profile exists
      const profile = await fetchProfile(userId, true);
      if (!profile) {
        throw new Error('Cannot assign firms: profile not found');
      }

      try {
        // Create firm assignments
        const assignments = firmIds.map((firmId) => ({
          user_id: userId,
          firm_id: firmId,
          assigned_at: new Date().toISOString(),
          is_active: true
        }));

        const { error } = await supabase
          .from('user_firm_assignments')
          .insert(assignments);

        if (error) {
          throw error;
        }

        console.log(
          `Successfully assigned user ${userId} to ${firmIds.length} firms`
        );

        // Refresh user session after firm assignment
        await fetchAndStoreUserSession(userId);
      } catch (error) {
        console.error('Firm assignment failed:', error);
        throw error;
      }
    },
    [supabase, fetchProfile]
  );

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);

          // Fetch profile - if it doesn't exist, create it
          let userProfile = await fetchProfile(initialSession.user.id);
          if (!userProfile) {
            console.log('Profile not found, creating...');
            userProfile = await createProfile(initialSession.user);
          }

          if (mounted) {
            setProfile(userProfile);

            // Load user session from cookie first
            loadUserSessionFromCookie();

            // Then refresh from database in background
            if (userProfile) {
              fetchAndStoreUserSession(initialSession.user.id).then(
                (sessionData) => {
                  if (mounted) {
                    setUserSession(sessionData);
                  }
                }
              );
            }
          }
        }

        setInitialized(true);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [supabase.auth, fetchProfile, createProfile, loadUserSessionFromCookie]);

  // Listen for auth changes
  useEffect(() => {
    if (!initialized) return;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);

      // Update session and user state
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        // Fetch profile for authenticated user - create if doesn't exist
        let userProfile = await fetchProfile(session.user.id);
        if (!userProfile) {
          console.log('Profile not found during auth change, creating...');
          userProfile = await createProfile(session.user);
        }
        setProfile(userProfile);

        // Update user session data on login
        if (event === 'SIGNED_IN' && userProfile) {
          console.log('User signed in, fetching session data...');
          const sessionData = await fetchAndStoreUserSession(session.user.id);
          setUserSession(sessionData);
        }

        // Handle redirects based on the auth action and current path
        if (event === 'SIGNED_IN' && lastAuthAction.current === 'signin') {
          // Only redirect on explicit sign-in, not on token refresh
          if (!isNavigating.current && !pathname.startsWith('/dashboard')) {
            isNavigating.current = true;
            router.push('/dashboard/overview');
            setTimeout(() => {
              isNavigating.current = false;
            }, 1000);
          }
          lastAuthAction.current = null;
        }
      } else {
        setProfile(null);
        setUserSession(null);
        profileCache.current.clear();
        clearUserSession(); // Clear cookies on sign out

        // Handle sign out redirect
        if (event === 'SIGNED_OUT' && lastAuthAction.current === 'signout') {
          if (!isNavigating.current && pathname.startsWith('/dashboard')) {
            isNavigating.current = true;
            router.push('/auth/sign-in');
            setTimeout(() => {
              isNavigating.current = false;
            }, 1000);
          }
          lastAuthAction.current = null;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [
    initialized,
    supabase.auth,
    fetchProfile,
    createProfile,
    router,
    pathname
  ]);

  const signOut = useCallback(async () => {
    try {
      lastAuthAction.current = 'signout';
      profileCache.current.clear();
      clearUserSession(); // Clear cookies before sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [supabase.auth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        lastAuthAction.current = 'signin';
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        return { error };
      } catch (error) {
        lastAuthAction.current = null;
        return { error };
      }
    },
    [supabase.auth]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: any,
      firmIds?: string[]
    ): Promise<{ error: any; warning?: string }> => {
      try {
        console.log('Starting user creation flow...');

        // Step 1: Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: metadata || {}
            }
          }
        );

        if (authError) {
          console.error('Auth creation failed:', authError);
          return { error: authError };
        }

        if (!authData.user) {
          return {
            error: new Error('User creation failed - no user returned')
          };
        }

        console.log('Auth user created:', authData.user.id);

        // Step 2: Wait briefly for auth user to be fully committed
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Step 3: Create profile with retries
        console.log('Creating profile...');
        const profile = await createProfile(authData.user);

        if (!profile) {
          return { error: new Error('Profile creation failed after retries') };
        }

        console.log('Profile created successfully:', profile.id);

        // Step 4: Assign firms if provided
        if (firmIds && firmIds.length > 0) {
          console.log(`Assigning user to ${firmIds.length} firms...`);
          try {
            await assignUserToFirms(authData.user.id, firmIds);
            console.log('Firm assignments completed successfully');
          } catch (firmError) {
            console.error('Firm assignment failed:', firmError);
            // User and profile created successfully, but firm assignment failed
            return {
              error: null,
              warning:
                'User created successfully, but firm assignment failed. Please assign manually.'
            };
          }
        }

        // Update local state
        setUser(authData.user);
        setProfile(profile);

        console.log('User creation flow completed successfully');
        return { error: null };
      } catch (error) {
        console.error('User creation flow failed:', error);
        return {
          error:
            error instanceof Error ? error : new Error('Unknown error occurred')
        };
      }
    },
    [supabase.auth, createProfile, assignUserToFirms]
  );

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (!error && profile) {
          const updatedProfile = { ...profile, ...updates };
          setProfile(updatedProfile);
          // Update cache
          profileCache.current.set(user.id, updatedProfile);

          // Refresh user session if role or firm assignments might have changed
          if (updates.role || updates.firm_id) {
            await refreshUserSession();
          }
        }

        return { error };
      } catch (error) {
        return { error };
      }
    },
    [user, profile, supabase, refreshUserSession]
  );

  const value = {
    user,
    profile,
    session,
    userSession,
    loading,
    signOut,
    signIn,
    signUp,
    updateProfile,
    refreshUserSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper hooks that mimic Clerk's API for easier migration
export const useUser = () => {
  const { user, profile, loading } = useAuth();
  return {
    user: profile, // Return the profile which has more info
    isLoaded: !loading,
    isSignedIn: !!user
  };
};

export const useSession = () => {
  const { session, loading } = useAuth();
  return {
    session,
    isLoaded: !loading
  };
};
