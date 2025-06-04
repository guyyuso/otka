import React from 'react';
import { Users, Apple as Apps, Shield, Activity } from 'lucide-react';
import Header from '../../components/Header';
import { AdminStats } from '../../types';

const AdminDashboard: React.FC = () => {
  // Mock stats data
  const stats: AdminStats = {
    totalUsers: 156,
    activeUsers: 89,
    totalApps: 24,
    loginAttempts: 1243
  };

  const statCards = [
    { title: 'משתמשים', value: stats.totalUsers, icon: Users, color: 'blue' },
    { title: 'משתמשים פעילים', value: stats.activeUsers, icon: Activity, color: 'green' },
    { title: 'אפליקציות', value: stats.totalApps, icon: Apps, color: 'purple' },
    { title: 'ניסיונות כניסה', value: stats.loginAttempts, icon: Shield, color: 'orange' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">לוח בקרה למנהל</h1>
          <p className="text-gray-600">סקירה כללית של המערכת</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <h3 className="text-gray-600 font-medium">{stat.title}</h3>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">משתמשים אחרונים</h2>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="mr-3">
                      <p className="font-medium text-gray-900">משתמש {i + 1}</p>
                      <p className="text-sm text-gray-500">user{i + 1}@example.com</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">לפני {i + 1} שעות</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">התראות אבטחה אחרונות</h2>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="mr-3">
                      <p className="font-medium text-gray-900">ניסיון כניסה חשוד</p>
                      <p className="text-sm text-gray-500">IP: 192.168.1.{i + 1}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">לפני {i * 10 + 5} דקות</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;