import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Header from '../components/Header';
import AppSection from '../components/AppSection';
import AddAppModal from '../components/AddAppModal';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { recentlyUsed, mainApps, loading } = useAppData();
  const { loading: authLoading } = useAuth();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  const hasApps = recentlyUsed.length > 0 || mainApps.length > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">האפליקציות שלי</h1>
            <p className="text-gray-600">גישה מהירה ובטוחה לכל האפליקציות שלך</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 ml-2" />
            הוסף אפליקציה
          </button>
        </div>

        {!hasApps ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין אפליקציות עדיין</h3>
            <p className="text-gray-600 mb-6">התחל על ידי הוספת האפליקציה הראשונה שלך</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center mx-auto hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 ml-2" />
              הוסף אפליקציה ראשונה
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {recentlyUsed.length > 0 && (
              <AppSection 
                title="אפליקציות אחרונות" 
                icon="clock" 
                apps={recentlyUsed} 
              />
            )}
            
            {mainApps.length > 0 && (
              <AppSection 
                title="כל האפליקציות" 
                icon="grid" 
                apps={mainApps} 
              />
            )}
          </div>
        )}

        <AddAppModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
        />
      </main>
    </div>
  );
};

export default DashboardPage;