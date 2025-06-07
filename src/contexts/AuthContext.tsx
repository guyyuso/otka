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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setIsAuthenticated(true);
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setIsAuthenticated(true);
        await fetchUserProfile(session.user.id);
      } else {
        setSupabaseUser(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Wait a bit for the trigger to create the profile
      let retries = 0;
      const maxRetries = 5;
      
      while (retries < maxRetries) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist yet, wait and retry
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        if (data) {
          setUser({
            id: data.id,
            name: data.full_name,
            email: supabaseUser?.email || '',
            role: data.role,
            createdAt: data.created_at,
            status: data.status
          });
          return;
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.error('Failed to fetch user profile after retries');
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      // If user is created successfully, the trigger should handle profile creation
      if (data.user) {
        console.log('User created successfully:', data.user.id);
      }

      return {};
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'An unexpected error occurred during registration' };
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
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