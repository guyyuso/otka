import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bell, 
  Settings, 
  LogOut,
  User,
  Menu,
  X,
  Shield,
  Users,
  LayoutDashboard
} from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    {
      id: 1,
      title: 'כניסה חדשה',
      message: 'זיהינו כניסה חדשה למערכת מ-Chrome ב-Windows',
      time: 'לפני 20 דקות',
      type: 'warning'
    },
    {
      id: 2,
      title: 'עדכון מערכת',
      message: 'המערכת עודכנה לגרסה החדשה ביותר',
      time: 'לפני שעה',
      type: 'info'
    },
    {
      id: 3,
      title: 'אימות הצליח',
      message: 'אימות דו-שלבי הופעל בהצלחה',
      time: 'אתמול',
      type: 'success'
    }
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <div className="flex items-center">
          <button 
            className="block md:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="flex items-center">
            <div className="flex items-center justify-center h-8 w-8 bg-blue-600 text-white rounded-md mr-2">
              <Shield size={16} />
            </div>
            <span className="text-xl font-bold text-blue-600 hidden md:block">סיגנון</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-1 space-x-reverse">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === '/' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            דף הבית
          </Link>
          {isAdmin() && (
            <>
              <Link 
                to="/admin" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/admin' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                ניהול
              </Link>
              <Link 
                to="/admin/users" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/admin/users' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                משתמשים
              </Link>
            </>
          )}
          <Link 
            to="/settings" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === '/settings' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            הגדרות
          </Link>
        </nav>

        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="relative">
            <button 
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
              onClick={toggleNotifications}
            >
              <Bell size={20} />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 origin-top-right transition-all transform scale-100 opacity-100">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">התראות</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          notification.type === 'success' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.type === 'warning' ? 'אזהרה' :
                           notification.type === 'success' ? 'הצלחה' : 'מידע'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                      <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 text-center border-t border-gray-100">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    צפה בכל ההתראות
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              className="flex items-center text-sm rounded-full focus:outline-none"
              onClick={toggleMenu}
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </button>

            {isMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'משתמש'}</p>
                  <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
                
                {isAdmin() && (
                  <>
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <LayoutDashboard size={16} className="ml-2" />
                        ניהול
                      </div>
                    </Link>
                    <Link 
                      to="/admin/users" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <Users size={16} className="ml-2" />
                        ניהול משתמשים
                      </div>
                    </Link>
                  </>
                )}
                
                <Link 
                  to="/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <Settings size={16} className="ml-2" />
                    הגדרות
                  </div>
                </Link>
                
                <Link 
                  to="/settings/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <User size={16} className="ml-2" />
                    פרופיל
                  </div>
                </Link>
                
                <button 
                  className="block w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <div className="flex items-center">
                    <LogOut size={16} className="ml-2" />
                    התנתק
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              דף הבית
            </Link>
            {isAdmin() && (
              <>
                <Link 
                  to="/admin" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === '/admin' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  ניהול
                </Link>
                <Link 
                  to="/admin/users" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === '/admin/users' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  משתמשים
                </Link>
              </>
            )}
            <Link 
              to="/settings" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/settings' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              הגדרות
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;