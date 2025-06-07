import React, { createContext, useState, useContext, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          setSupabaseUser(session.user);
          setIsAuthenticated(true);
          await fetchUserProfile(session.user.id, session.user.email || '');
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (session?.user) {
          setSupabaseUser(session.user);
          setIsAuthenticated(true);
          await fetchUserProfile(session.user.id, session.user.email || '');
        } else {
          setSupabaseUser(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const createFallbackUser = (userId: string, email: string): User => {
    return {
      id: userId,
      name: email.split('@')[0] || 'User',
      email: email,
      role: 'user',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
  };

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      // Always create a fallback user first to ensure consistent state
      const fallbackUser = createFallbackUser(userId, email);
      setUser(fallbackUser);

      // Try to get the profile with a shorter timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, keep the fallback user
          console.log('Profile not found, using fallback user object');
          return;
        }
        if (error.message === 'Profile fetch timeout') {
          console.warn('Profile fetch timed out, using fallback user');
          return;
        }
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        // Update with actual profile data
        setUser({
          id: data.id,
          name: data.full_name,
          email: email,
          role: data.role || 'user',
          createdAt: data.created_at,
          status: data.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Ensure we always have a user object when authenticated
      if (!user) {
        setUser(createFallbackUser(userId, email));
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      
      // Validate input
      if (!email || !password) {
        return { error: 'Email and password are required' };
      }

      if (!email.includes('@')) {
        return { error: 'Please enter a valid email address' };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password. Please check your credentials and try again.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Please check your email and click the confirmation link before signing in.' };
        }
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      
      // Validate input
      if (!email || !password || !fullName) {
        return { error: 'All fields are required' };
      }

      if (!email.includes('@')) {
        return { error: 'Please enter a valid email address' };
      }

      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim()
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          return { error: 'An account with this email already exists. Please sign in instead.' };
        }
        return { error: error.message };
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // Create user profile immediately after successful registration
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              full_name: fullName.trim(),
              role: 'user',
              status: 'active'
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Don't return error here as the user was created successfully
            // The profile will be created as a fallback in fetchUserProfile
          } else {
            console.log('User profile created successfully');
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return {};
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'An unexpected error occurred during registration. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      // Clear user state immediately
      setUser(null);
      setSupabaseUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      supabaseUser,
      loading,
      login, 
      register,
      logout, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};