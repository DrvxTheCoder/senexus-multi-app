'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  firm_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  updateProfile: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();
  
  // Use refs to prevent unnecessary re-renders
  const profileCache = useRef<Map<string, Profile>>(new Map());
  const lastProfileFetch = useRef<number>(0);
  const isNavigating = useRef<boolean>(false);
  
  // Optimized profile fetching with caching and debouncing
  const fetchProfile = useCallback(async (userId: string, force = false) => {
    const now = Date.now();
    const cacheKey = userId;
    
    // Check cache first (cache for 30 seconds)
    if (!force && profileCache.current.has(cacheKey) && (now - lastProfileFetch.current) < 30000) {
      return profileCache.current.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        profileCache.current.set(cacheKey, data);
        lastProfileFetch.current = now;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, [supabase]);

  // Optimized profile creation with better error handling
  const createProfile = useCallback(async (user: User) => {
    try {
      const profileData = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'user'
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      // Update cache
      profileCache.current.set(user.id, data);
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }, [supabase]);

  // Initialize auth state only once
  useEffect(() => {
    if (initialized) return;

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          setInitialized(true);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch profile without blocking the UI
          fetchProfile(session.user.id).then(userProfile => {
            if (!isMounted) return;
            
            if (!userProfile) {
              // Try to create profile if it doesn't exist
              createProfile(session.user).then(newProfile => {
                if (isMounted) {
                  setProfile(newProfile);
                }
              });
            } else {
              setProfile(userProfile);
            }
          });
        }

        setLoading(false);
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [initialized, supabase.auth, fetchProfile, createProfile]);

  // Listen for auth changes (only after initialization)
  useEffect(() => {
    if (!initialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        // Prevent navigation loops
        if (isNavigating.current) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Non-blocking profile fetch
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
          
          // Only redirect on sign in, not on token refresh
          if (event === 'SIGNED_IN' && !isNavigating.current) {
            isNavigating.current = true;
            router.push('/dashboard/overview');
            setTimeout(() => { isNavigating.current = false; }, 1000);
          }
        } else {
          setProfile(null);
          profileCache.current.clear();
          
          // Only redirect on sign out, not on initialization
          if (event === 'SIGNED_OUT' && !isNavigating.current) {
            isNavigating.current = true;
            router.push('/auth/sign-in');
            setTimeout(() => { isNavigating.current = false; }, 1000);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initialized, supabase.auth, fetchProfile, router]);

  const signOut = useCallback(async () => {
    try {
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
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