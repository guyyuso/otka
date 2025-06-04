import React, { useState } from 'react';
import { User, UserPlus, Search, MoreVertical, Shield, Ban, Trash } from 'lucide-react';
import Header from '../../components/Header';
import { User as UserType } from '../../types';

const UsersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock users data
  const users: UserType[] = [
    {
      id: '1',
      name: 'משה כהן',
      email: 'moshe@example.com',
      role: 'admin',
      createdAt: '2024-01-15T10:00:00Z',
      lastLogin: '2024-03-20T15:30:00Z',
      status: 'active'
    },
    {
      id: '2',
      name: 'שרה לוי',
      email: 'sarah@example.com',
      role: 'user',
      createdAt: '2024-02-01T09:00:00Z',
      lastLogin: '2024-03-19T11:20:00Z',
      status: 'active'
    },
    // Add more mock users as needed
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
            <p className="text-gray-600">ניהול והרשאות משתמשים במערכת</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors">
            <UserPlus className="w-5 h-5 ml-2" />
            משתמש חדש
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="חיפוש משתמשים..."
                className="w-full pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    משתמש
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תפקיד
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    כניסה אחרונה
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">פעולות</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'מנהל' : 'משתמש'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'active' ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.lastLogin || '').toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-500">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block">
                          <div className="py-1" role="menu">
                            <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right">
                              <Shield className="ml-2 w-4 h-4 text-blue-500" />
                              שנה הרשאות
                            </button>
                            <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right">
                              <Ban className="ml-2 w-4 h-4 text-orange-500" />
                              השהה משתמש
                            </button>
                            <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-right">
                              <Trash className="ml-2 w-4 h-4" />
                              מחק משתמש
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UsersManagement;