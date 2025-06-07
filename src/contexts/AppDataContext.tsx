import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { AppData } from '../types';

interface AppDataContextType {
  recentlyUsed: AppData[];
  mainApps: AppData[];
  loading: boolean;
  addApp: (app: Omit<AppData, 'id' | 'lastUsed'>) => Promise<void>;
  removeApp: (appId: string) => Promise<void>;
  updateApp: (appId: string, data: Partial<AppData>) => Promise<void>;
  updateLastUsed: (appId: string) => Promise<void>;
  refreshApps: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentlyUsed, setRecentlyUsed] = useState<AppData[]>([]);
  const [mainApps, setMainApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchApps();
    } else {
      setRecentlyUsed([]);
      setMainApps([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchApps = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching apps:', error);
        return;
      }

      const apps: AppData[] = data.map(app => ({
        id: app.id,
        name: app.name,
        logo: app.logo_url || '',
        url: app.url,
        username: app.username || '',
        password: app.password || '',
        lastUsed: app.last_used || undefined,
        category: app.category
      }));

      // Split into recently used (last 7 days) and main apps
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recent = apps.filter(app => 
        app.lastUsed && new Date(app.lastUsed) > sevenDaysAgo
      ).sort((a, b) => 
        new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime()
      );

      const main = apps.filter(app => 
        !app.lastUsed || new Date(app.lastUsed) <= sevenDaysAgo
      );

      setRecentlyUsed(recent);
      setMainApps(main);
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const addApp = async (app: Omit<AppData, 'id' | 'lastUsed'>): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          name: app.name,
          url: app.url,
          logo_url: app.logo,
          username: app.username,
          password: app.password,
          category: app.category || 'general'
        });

      if (error) {
        console.error('Error adding app:', error);
        return;
      }

      await fetchApps();
    } catch (error) {
      console.error('Error adding app:', error);
    }
  };

  const removeApp = async (appId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId);

      if (error) {
        console.error('Error removing app:', error);
        return;
      }

      await fetchApps();
    } catch (error) {
      console.error('Error removing app:', error);
    }
  };

  const updateApp = async (appId: string, data: Partial<AppData>): Promise<void> => {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.url) updateData.url = data.url;
      if (data.logo) updateData.logo_url = data.logo;
      if (data.username) updateData.username = data.username;
      if (data.password) updateData.password = data.password;
      if (data.category) updateData.category = data.category;

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', appId);

      if (error) {
        console.error('Error updating app:', error);
        return;
      }

      await fetchApps();
    } catch (error) {
      console.error('Error updating app:', error);
    }
  };

  const updateLastUsed = async (appId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ last_used: new Date().toISOString() })
        .eq('id', appId);

      if (error) {
        console.error('Error updating last used:', error);
        return;
      }

      await fetchApps();
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  };

  const refreshApps = async (): Promise<void> => {
    await fetchApps();
  };

  return (
    <AppDataContext.Provider value={{ 
      recentlyUsed, 
      mainApps, 
      loading,
      addApp, 
      removeApp, 
      updateApp,
      updateLastUsed,
      refreshApps
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};