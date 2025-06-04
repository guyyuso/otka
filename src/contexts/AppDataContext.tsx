import React, { createContext, useContext, useState } from 'react';
import { AppData } from '../types';

interface AppDataContextType {
  recentlyUsed: AppData[];
  mainApps: AppData[];
  addApp: (app: AppData) => void;
  removeApp: (appId: string) => void;
  updateApp: (appId: string, data: Partial<AppData>) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Mock data for initial apps
const initialRecentlyUsed: AppData[] = [
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
    url: 'https://workspace.google.com',
    username: 'user@example.com',
    lastUsed: new Date().toISOString()
  },
  {
    id: 'slack',
    name: 'Slack',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png',
    url: 'https://slack.com',
    username: 'user@example.com',
    lastUsed: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
    url: 'https://salesforce.com',
    username: 'user@example.com',
    lastUsed: new Date(Date.now() - 7200000).toISOString()
  }
];

const initialMainApps: AppData[] = [
  {
    id: 'office365',
    name: 'Office 365',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg/1200px-Microsoft_Office_logo_%282019%E2%80%93present%29.svg.png',
    url: 'https://www.office.com',
    username: 'user@example.com'
  },
  {
    id: 'box',
    name: 'Box',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Box%2C_Inc._logo.svg/1200px-Box%2C_Inc._logo.svg.png',
    url: 'https://box.com',
    username: 'user@example.com'
  },
  {
    id: 'zoom',
    name: 'Zoom',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Zoom_logo.svg/1200px-Zoom_logo.svg.png',
    url: 'https://zoom.us',
    username: 'user@example.com'
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/DocuSign_logo.svg/2560px-DocuSign_logo.svg.png',
    url: 'https://docusign.com',
    username: 'user@example.com'
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Greenhouse_Logo.svg/2560px-Greenhouse_Logo.svg.png',
    url: 'https://greenhouse.io',
    username: 'user@example.com'
  },
  {
    id: 'concur',
    name: 'Concur',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/SAP_Concur_logo.svg',
    url: 'https://concur.com',
    username: 'user@example.com'
  }
];

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentlyUsed, setRecentlyUsed] = useState<AppData[]>(initialRecentlyUsed);
  const [mainApps, setMainApps] = useState<AppData[]>(initialMainApps);

  const addApp = (app: AppData) => {
    setMainApps([...mainApps, app]);
  };

  const removeApp = (appId: string) => {
    setRecentlyUsed(recentlyUsed.filter(app => app.id !== appId));
    setMainApps(mainApps.filter(app => app.id !== appId));
  };

  const updateApp = (appId: string, data: Partial<AppData>) => {
    setRecentlyUsed(recentlyUsed.map(app => 
      app.id === appId ? { ...app, ...data } : app
    ));
    
    setMainApps(mainApps.map(app => 
      app.id === appId ? { ...app, ...data } : app
    ));
  };

  return (
    <AppDataContext.Provider value={{ 
      recentlyUsed, 
      mainApps, 
      addApp, 
      removeApp, 
      updateApp 
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