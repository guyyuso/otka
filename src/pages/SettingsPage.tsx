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
      title: 'אבטחה',
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      items: [
        { id: 'password', label: 'שינוי סיסמה' },
        { id: 'mfa', label: 'אימות דו-שלבי' },
        { id: 'sessions', label: 'התקנים מחוברים' }
      ]
    },
    {
      id: 'passwords',
      title: 'ניהול סיסמאות',
      icon: <Lock className="w-5 h-5 text-green-600" />,
      items: [
        { id: 'generate', label: 'יצירת סיסמה חזקה' },
        { id: 'audit', label: 'בדיקת חוזק סיסמאות' },
        { id: 'export', label: 'ייצוא סיסמאות' }
      ]
    },
    {
      id: 'notifications',
      title: 'התראות',
      icon: <Bell className="w-5 h-5 text-yellow-600" />,
      items: [
        { id: 'login-alerts', label: 'התראות כניסה' },
        { id: 'security-alerts', label: 'התראות אבטחה' },
        { id: 'updates', label: 'עדכוני מערכת' }
      ]
    },
    {
      id: 'devices',
      title: 'מכשירים',
      icon: <Smartphone className="w-5 h-5 text-purple-600" />,
      items: [
        { id: 'manage-devices', label: 'ניהול מכשירים' },
        { id: 'trusted-devices', label: 'מכשירים מהימנים' }
      ]
    },
    {
      id: 'account',
      title: 'חשבון',
      icon: <UserCog className="w-5 h-5 text-gray-600" />,
      items: [
        { id: 'profile', label: 'פרטי פרופיל' },
        { id: 'preferences', label: 'העדפות' },
        { id: 'delete-account', label: 'מחיקת חשבון' }
      ]
    },
    {
      id: 'activity',
      title: 'פעילות ודוחות',
      icon: <History className="w-5 h-5 text-orange-600" />,
      items: [
        { id: 'login-history', label: 'היסטוריית כניסות' },
        { id: 'app-usage', label: 'שימוש באפליקציות' },
        { id: 'reports', label: 'דוחות מפורטים' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">הגדרות</h1>
          <p className="text-gray-600">ניהול האבטחה והעדפות המערכת</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsSections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                {section.icon}
                <h2 className="text-lg font-medium text-gray-900 mr-2">{section.title}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-right"
                  >
                    <span className="text-gray-800">{item.label}</span>
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
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