import React from 'react';
import Header from '../components/Header';
import AppSection from '../components/AppSection';
import { useAppData } from '../contexts/AppDataContext';

const DashboardPage: React.FC = () => {
  const { recentlyUsed, mainApps } = useAppData();

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="space-y-8">
          <AppSection 
            title="אפליקציות אחרונות" 
            icon="clock" 
            apps={recentlyUsed} 
          />
          
          <AppSection 
            title="אפליקציות מרכזיות" 
            icon="grid" 
            apps={mainApps} 
          />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;