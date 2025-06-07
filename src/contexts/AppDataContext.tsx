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
  const [loading, setLoading] = useState<boolean>(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch apps when auth is complete and user is authenticated
    if (!authLoading && isAuthenticated && user) {
      fetchApps();
    } else if (!authLoading && !isAuthenticated) {
      // Clear data when not authenticated
      setRecentlyUsed([]);
      setMainApps([]);
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  const fetchApps = async () => {
    if (!user || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Apps fetch timeout')), 10000)
      );

      const appsPromise = supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await Promise.race([appsPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching apps:', error);
        setRecentlyUsed([]);
        setMainApps([]);
        return;
      }

      const apps: AppData[] = (data || []).map((app: any) => ({
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
      setRecentlyUsed([]);
      setMainApps([]);
    } finally {
      setLoading(false);
    }
  };

  const addApp = async (app: Omit<AppData, 'id' | 'lastUsed'>): Promise<void> => {
    if (!user || !isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          name: app.name,
          url: app.url,
          logo_url: app.logo || null,
          username: app.username || null,
          password: app.password || null,
          category: app.category || 'general'
        });

      if (error) {
        console.error('Error adding app:', error);
        throw new Error('Failed to add application');
      }

      await fetchApps();
    } catch (error) {
      console.error('Error adding app:', error);
      throw error;
    }
  };

  const removeApp = async (appId: string): Promise<void> => {
    if (!user || !isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId)
        .eq('user_id', user.id); // Ensure user can only delete their own apps

      if (error) {
        console.error('Error removing app:', error);
        throw new Error('Failed to remove application');
      }

      await fetchApps();
    } catch (error) {
      console.error('Error removing app:', error);
      throw error;
    }
  };

  const updateApp = async (appId: string, data: Partial<AppData>): Promise<void> => {
    if (!user || !isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.url !== undefined) updateData.url = data.url;
      if (data.logo !== undefined) updateData.logo_url = data.logo;
      if (data.username !== undefined) updateData.username = data.username;
      if (data.password !== undefined) updateData.password = data.password;
      if (data.category !== undefined) updateData.category = data.category;

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', appId)
        .eq('user_id', user.id); // Ensure user can only update their own apps

      if (error) {
        console.error('Error updating app:', error);
        throw new Error('Failed to update application');
      }

      await fetchApps();
    } catch (error) {
      console.error('Error updating app:', error);
      throw error;
    }
  };

  const updateLastUsed = async (appId: string): Promise<void> => {
    if (!user || !isAuthenticated) {
      return; // Silently fail if not authenticated
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({ last_used: new Date().toISOString() })
        .eq('id', appId)
        .eq('user_id', user.id); // Ensure user can only update their own apps

      if (error) {
        console.error('Error updating last used:', error);
        return;
      }

      // Don't refresh all apps for this operation to avoid unnecessary loading
      // Just update the local state
      const updateAppInList = (apps: AppData[]) => 
        apps.map(app => 
          app.id === appId 
            ? { ...app, lastUsed: new Date().toISOString() }
            : app
        );

      setRecentlyUsed(prev => updateAppInList(prev));
      setMainApps(prev => updateAppInList(prev));
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