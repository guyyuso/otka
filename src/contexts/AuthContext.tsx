import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const { isAuthenticated: storedIsAuth, user: storedUser } = JSON.parse(storedAuth);
      setIsAuthenticated(storedIsAuth);
      setUser(storedUser);
    }
  }, []);

  const login = () => {
    const mockUser: User = {
      id: '123',
      name: 'משה ישראלי',
      email: 'moshe@example.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    
    localStorage.setItem('auth', JSON.stringify({ 
      isAuthenticated: true,
      user: mockUser
    }));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth');
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isAdmin }}>
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