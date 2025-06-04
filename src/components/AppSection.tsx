import React from 'react';
import AppTile from './AppTile';
import { AppData } from '../types';
import { Clock, Grid } from 'lucide-react';

interface AppSectionProps {
  title: string;
  icon: 'clock' | 'grid';
  apps: AppData[];
}

const AppSection: React.FC<AppSectionProps> = ({ title, icon, apps }) => {
  return (
    <section className="fade-in\" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center mb-4">
        {icon === 'clock' ? (
          <Clock className="w-5 h-5 ml-2 text-gray-600" />
        ) : (
          <Grid className="w-5 h-5 ml-2 text-gray-600" />
        )}
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {apps.map((app) => (
          <AppTile key={app.id} app={app} />
        ))}
      </div>
    </section>
  );
};

export default AppSection;