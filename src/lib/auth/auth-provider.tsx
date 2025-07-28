'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

interface Profile {
  id: string;
  firm_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  
  // Track navigation to prevent unwanted redirects
  const isNavigating = useRef(false);
  const lastAuthAction = useRef<'signin' | 'signout' | 'init' | null>(null);
  const profileCache = useRef(new Map<string, Profile>());

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Check cache first
    if (profileCache.current.has(userId)) {
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
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Fetch profile
          const userProfile = await fetchProfile(initialSession.user.id);
          if (mounted) {
            setProfile(userProfile);
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
  }, [supabase.auth, fetchProfile]);

  // Listen for auth changes
  useEffect(() => {
    if (!initialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);

        // Update session and user state
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          // Fetch profile for authenticated user
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
          
          // Handle redirects based on the auth action and current path
          if (event === 'SIGNED_IN' && lastAuthAction.current === 'signin') {
            // Only redirect on explicit sign-in, not on token refresh
            if (!isNavigating.current && !pathname.startsWith('/dashboard')) {
              isNavigating.current = true;
              router.push('/dashboard/overview');
              setTimeout(() => { isNavigating.current = false; }, 1000);
            }
            lastAuthAction.current = null;
          }
        } else {
          setProfile(null);
          profileCache.current.clear();
          
          // Handle sign out redirect
          if (event === 'SIGNED_OUT' && lastAuthAction.current === 'signout') {
            if (!isNavigating.current && pathname.startsWith('/dashboard')) {
              isNavigating.current = true;
              router.push('/auth/sign-in');
              setTimeout(() => { isNavigating.current = false; }, 1000);
            }
            lastAuthAction.current = null;
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initialized, supabase.auth, fetchProfile, router, pathname]);

  const signOut = useCallback(async () => {
    try {
      lastAuthAction.current = 'signout';
      profileCache.current.clear();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [supabase.auth]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      lastAuthAction.current = 'signin';
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      lastAuthAction.current = null;
      return { error };
    }
  }, [supabase.auth]);

  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  }, [supabase.auth]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
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
      }

      return { error };
    } catch (error) {
      return { error };
    }
  }, [user, profile, supabase]);

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    signIn,
    signUp,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
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
    isSignedIn: !!user,
  };
};

export const useSession = () => {
  const { session, loading } = useAuth();
  return {
    session,
    isLoaded: !loading,
  };
};