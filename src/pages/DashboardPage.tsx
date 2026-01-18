import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Header from '../components/Header';
import AppSection from '../components/AppSection';
import AddAppModal from '../components/AddAppModal';
import PinModal from '../components/PinModal';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../lib/api';
import { AppData } from '../types';

const DashboardPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingApp, setPendingApp] = useState<AppData | null>(null);
  const { recentlyUsed, mainApps, assignedApps, loading } = useAppData();
  const { loading: authLoading } = useAuth();

  // Show loading only if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleAppLaunch = async (app: AppData) => {
    // If assigned app requires PIN, show PIN modal
    if (app.isAssigned && app.requiresPin && app.appTileId) {
      setPendingApp(app);
      setPinModalOpen(true);
      return;
    }
    // Otherwise launch directly
    window.open(app.url, '_blank');
  };

  const handlePinVerify = async (pin: string): Promise<{ verified: boolean; error?: string; remainingAttempts?: number }> => {
    if (!pendingApp?.appTileId) {
      return { verified: false, error: 'Invalid app' };
    }

    try {
      const result = await dashboardApi.verifyPin(pendingApp.appTileId, pin);
      if (result.verified) {
        setPinModalOpen(false);
        window.open(pendingApp.url, '_blank');
        setPendingApp(null);
      }
      return result;
    } catch (err) {
      const error = err as { message?: string; remainingAttempts?: number };
      return {
        verified: false,
        error: error.message || 'Verification failed',
        remainingAttempts: error.remainingAttempts
      };
    }
  };

  const hasApps = recentlyUsed.length > 0 || mainApps.length > 0 || assignedApps.length > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600">Quick and secure access to all your applications</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Application
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        ) : !hasApps ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-6">Start by adding your first application</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center mx-auto hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add First Application
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Unified Apps Grid */}
            <AppSection
              title="My Applications"
              icon="grid"
              apps={[...assignedApps, ...recentlyUsed, ...mainApps]}
              onAddClick={() => setIsAddModalOpen(true)}
              onAppLaunch={handleAppLaunch}
            />
          </div>
        )}

        <AddAppModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />

        <PinModal
          isOpen={pinModalOpen}
          onClose={() => {
            setPinModalOpen(false);
            setPendingApp(null);
          }}
          onVerify={handlePinVerify}
          appName={pendingApp?.name || ''}
        />
      </main>
    </div>
  );
};

export default DashboardPage;