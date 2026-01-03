import React, { createContext, useContext, useState, useEffect } from 'react';
import { applicationsApi } from '../lib/api';
import { useAuth } from './AuthContext';
import { AppData } from '../types';

interface AppDataContextType {
  recentlyUsed: AppData[];
  mainApps: AppData[];
  assignedApps: AppData[];
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
  const [assignedApps, setAssignedApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchApps();
    } else if (!authLoading && !isAuthenticated) {
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

      const [data, assignedData] = await Promise.all([
        applicationsApi.getAll(),
        (applicationsApi as any).getAssigned().catch(() => []) // Handle potential failures gracefully
      ]);

      const apps: AppData[] = (data || []).map((app: any) => ({
        id: app.id,
        name: app.name,
        logo: app.logo_url || '',
        url: app.url,
        username: app.username || '',
        password: app.password || '',
        lastUsed: app.last_used || undefined,
        category: app.category,
        isPersonal: true
      }));

      const assigned: AppData[] = (assignedData || []).map((app: any) => ({
        id: `assigned-${app.id}`, // specific ID to avoid collision
        appTileId: app.app_tile_id || app.id, // actual app tile ID for PIN verification
        name: app.name,
        logo: app.logo_url || '',
        url: app.url || app.launch_url,
        username: app.app_username || '',
        password: '', // No password, use PIN instead
        category: app.category,
        authType: app.auth_type,
        isAssigned: true,
        requiresPin: app.requires_pin ?? true // Default to requiring PIN
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
      setAssignedApps(assigned);
    } catch (error) {
      console.error('Error fetching apps:', error);
      setRecentlyUsed([]);
      setMainApps([]);
      setAssignedApps([]);
    } finally {
      setLoading(false);
    }
  };

  const addApp = async (app: Omit<AppData, 'id' | 'lastUsed'>): Promise<void> => {
    if (!user || !isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      await applicationsApi.create({
        name: app.name,
        url: app.url,
        logoUrl: app.logo || undefined,
        username: app.username || undefined,
        password: app.password || undefined,
        category: app.category || 'General'
      });

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
      await applicationsApi.delete(appId);
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
      if (data.logo !== undefined) updateData.logoUrl = data.logo;
      if (data.username !== undefined) updateData.username = data.username;
      if (data.password !== undefined) updateData.password = data.password;
      if (data.category !== undefined) updateData.category = data.category;

      await applicationsApi.update(appId, updateData);
      await fetchApps();
    } catch (error) {
      console.error('Error updating app:', error);
      throw error;
    }
  };

  const updateLastUsed = async (appId: string): Promise<void> => {
    if (!user || !isAuthenticated) {
      return;
    }

    try {
      await applicationsApi.access(appId);

      // Update local state
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
      assignedApps,
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