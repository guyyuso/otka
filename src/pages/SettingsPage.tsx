import React from 'react';
import Header from '../components/Header';
import { 
  Shield, 
  Lock, 
  Bell, 
  Smartphone, 
  UserCog,
  History
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const settingsSections = [
    {
      id: 'security',
      title: 'Security',
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      items: [
        { id: 'password', label: 'Change Password' },
        { id: 'mfa', label: 'Two-Factor Authentication' },
        { id: 'sessions', label: 'Connected Devices' }
      ]
    },
    {
      id: 'passwords',
      title: 'Password Management',
      icon: <Lock className="w-5 h-5 text-green-600" />,
      items: [
        { id: 'generate', label: 'Generate Strong Password' },
        { id: 'audit', label: 'Password Strength Audit' },
        { id: 'export', label: 'Export Passwords' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell className="w-5 h-5 text-yellow-600" />,
      items: [
        { id: 'login-alerts', label: 'Login Alerts' },
        { id: 'security-alerts', label: 'Security Alerts' },
        { id: 'updates', label: 'System Updates' }
      ]
    },
    {
      id: 'devices',
      title: 'Devices',
      icon: <Smartphone className="w-5 h-5 text-purple-600" />,
      items: [
        { id: 'manage-devices', label: 'Manage Devices' },
        { id: 'trusted-devices', label: 'Trusted Devices' }
      ]
    },
    {
      id: 'account',
      title: 'Account',
      icon: <UserCog className="w-5 h-5 text-gray-600" />,
      items: [
        { id: 'profile', label: 'Profile Details' },
        { id: 'preferences', label: 'Preferences' },
        { id: 'delete-account', label: 'Delete Account' }
      ]
    },
    {
      id: 'activity',
      title: 'Activity & Reports',
      icon: <History className="w-5 h-5 text-orange-600" />,
      items: [
        { id: 'login-history', label: 'Login History' },
        { id: 'app-usage', label: 'Application Usage' },
        { id: 'reports', label: 'Detailed Reports' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage security and system preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsSections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                {section.icon}
                <h2 className="text-lg font-medium text-gray-900 ml-2">{section.title}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left"
                  >
                    <span className="text-gray-800">{item.label}</span>
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;