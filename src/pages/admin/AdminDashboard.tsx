import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Apple as Apps,
  Activity,
  Settings,
  FileText,
  Database,
  Server,
  UserCheck,
  BarChart3,
  Clock,
  HardDrive,
  Globe,
  RefreshCw,
  Lock
} from 'lucide-react';
import Header from '../../components/Header';
import { adminApi, usersApi } from '../../lib/api';
import { AdminStats } from '../../types';

import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalApps: 0,
    loginAttempts: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        adminApi.getStats(),
        usersApi.getAll().catch(() => [])
      ]);
      setStats(statsData);
      setRecentUsers(usersData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>

        {/* Info Boxes - AdminLTE Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 opacity-30" />
            </div>
            <Link to="/admin/users" className="block mt-3 text-sm text-blue-100 hover:text-white">
              More info →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Users</p>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
              </div>
              <UserCheck className="w-12 h-12 opacity-30" />
            </div>
            <Link to="/admin/users" className="block mt-3 text-sm text-green-100 hover:text-white">
              More info →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Applications</p>
                <p className="text-3xl font-bold">{stats.totalApps}</p>
              </div>
              <Apps className="w-12 h-12 opacity-30" />
            </div>
            <Link to="/admin/apps" className="block mt-3 text-sm text-purple-100 hover:text-white">
              Manage Apps →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Sessions</p>
                <p className="text-3xl font-bold">{recentUsers.length}</p>
              </div>
              <Activity className="w-12 h-12 opacity-30" />
            </div>
            <span className="block mt-3 text-sm text-orange-100">
              Active now
            </span>
          </div>
        </div>

        {/* Admin Tiles - Similar to Settings Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* User Management Tile */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900 ml-2">User Management</h2>
            </div>
            <div className="divide-y divide-gray-200">
              <Link to="/admin/users" className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors">
                <span className="text-gray-800">View All Users</span>
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link to="/admin/users" className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors">
                <span className="text-gray-800">Add New User</span>
                <span className="flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded mr-2">Soon</span>
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </Link>
              <Link to="/admin/users" className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors">
                <span className="text-gray-800">User Roles</span>
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>

          {/* System Status Tile */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <Server className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-medium text-gray-900 ml-2">System Status</h2>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-800">Database</span>
                </div>
                <span className="flex items-center text-green-600 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Online
                </span>
              </div>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-800">API Server</span>
                </div>
                <span className="flex items-center text-green-600 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Running
                </span>
              </div>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <HardDrive className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-800">Storage</span>
                </div>
                <span className="text-gray-600 text-sm">Available</span>
              </div>
            </div>
          </div>

          {/* System Logs Tile */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-medium text-gray-900 ml-2">System Logs</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {isSuperAdmin() ? (
                <Link to="/admin/logs" className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors">
                  <span className="text-gray-800">View Application Logs</span>
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              ) : (
                <div className="w-full px-6 py-4 flex items-center justify-between text-gray-400 cursor-not-allowed">
                  <span className="flex items-center">
                    View Application Logs
                    <Lock className="w-3 h-3 ml-2 text-gray-400" />
                  </span>
                </div>
              )}
              <div className="w-full px-6 py-4 flex items-center justify-between text-gray-500">
                <span>Security Audit Logs</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">Soon</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-medium text-gray-900 ml-2">Reports & Analytics</h2>
            </div>
            <div className="divide-y divide-gray-200">
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left">
                <span className="text-gray-800">User Activity Report</span>
                <span className="flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded mr-2">Soon</span>
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left">
                <span className="text-gray-800">Application Usage</span>
                <span className="flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded mr-2">Soon</span>
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left">
                <span className="text-gray-800">Security Audit</span>
                <span className="flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded mr-2">Soon</span>
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* System Settings Tile */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <Settings className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-medium text-gray-900 ml-2">System Settings</h2>
            </div>
            <div className="divide-y divide-gray-200">
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left">
                <span className="text-gray-800">General Settings</span>
                <span className="flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded mr-2">Soon</span>
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left">
                <span className="text-gray-800">Security Settings</span>
                <span className="flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded mr-2">Soon</span>
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left">
                <span className="text-gray-800">Backup & Restore</span>
                <span className="flex items-center">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded mr-2">Soon</span>
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-medium text-gray-900 ml-2">Recent Users</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchData}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <Link to="/admin/users" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No users yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;