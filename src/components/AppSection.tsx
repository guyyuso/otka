import React from 'react';
import AppTile from './AppTile';
import { AppData } from '../types';
import { Clock, Grid, Shield } from 'lucide-react';

interface AppSectionProps {
  title: string;
  icon: 'clock' | 'grid' | 'shield';
  apps: AppData[];
  onAddClick?: () => void;
  onAppLaunch?: (app: AppData) => void;
}

const AppSection: React.FC<AppSectionProps> = ({ title, icon, apps, onAddClick, onAppLaunch }) => {
  return (
    <section className="fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center mb-4">
        {icon === 'clock' ? (
          <Clock className="w-5 h-5 mr-2 text-gray-600" />
        ) : icon === 'shield' ? (
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
        ) : (
          <Grid className="w-5 h-5 mr-2 text-gray-600" />
        )}
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {apps.map((app) => (
          <AppTile key={app.id} app={app} onAddClick={onAddClick} onAppLaunch={onAppLaunch} />
        ))}
      </div>
    </section>
  );
};

export default AppSection;