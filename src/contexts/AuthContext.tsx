import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi, setAuthToken, getAuthToken } from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();

      if (token) {
        try {
          const data = await authApi.getMe();
          setUser(data.user);
          setIsAuthenticated(true);
        } catch {
          // Token invalid, clear it
          setAuthToken(null);
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      if (!email || !password) {
        return { error: 'Email and password are required' };
      }

      if (!email.includes('@')) {
        return { error: 'Please enter a valid email address' };
      }

      const data = await authApi.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      if (!email || !password || !fullName) {
        return { error: 'All fields are required' };
      }

      if (!email.includes('@')) {
        return { error: 'Please enter a valid email address' };
      }

      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long' };
      }

      const data = await authApi.register(email, password, fullName);
      setUser(data.user);
      setIsAuthenticated(true);
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred during registration. Please try again.';
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch {
      // Silent error - user is logged out anyway
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === 'super_admin';
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      login,
      register,
      logout,
      isAdmin,
      isSuperAdmin
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