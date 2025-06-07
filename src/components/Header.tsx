import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
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
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            <div className="flex items-center justify-center h-8 w-8 bg-blue-600 text-white rounded-md ml-2">
              <Shield size={16} />
            </div>
            <span className="text-xl font-bold text-blue-600 hidden md:block">SecureApps</span>
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
            Dashboard
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
                Admin
              </Link>
              <Link 
                to="/admin/users" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/admin/users' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Users
              </Link>
            </>
          )}
          <Link 
            to="/notes" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === '/notes' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Notes
          </Link>
          <Link 
            to="/downloads" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === '/downloads' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Downloads
          </Link>
          <Link 
            to="/settings" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === '/settings' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Settings
          </Link>
        </nav>

        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="relative">
            <button 
              className="flex items-center text-sm rounded-full focus:outline-none"
              onClick={toggleMenu}
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block ml-2 text-left">
                <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
              </div>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
                
                {isAdmin() && (
                  <>
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <LayoutDashboard size={16} className="mr-2" />
                        Admin Panel
                      </div>
                    </Link>
                    <Link 
                      to="/admin/users" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <Users size={16} className="mr-2" />
                        User Management
                      </div>
                    </Link>
                  </>
                )}
                
                <Link 
                  to="/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <Settings size={16} className="mr-2" />
                    Settings
                  </div>
                </Link>
                
                <Link 
                  to="/settings/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <User size={16} className="mr-2" />
                    Profile
                  </div>
                </Link>
                
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <div className="flex items-center">
                    <LogOut size={16} className="mr-2" />
                    Sign Out
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
              Dashboard
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
                  Admin Panel
                </Link>
                <Link 
                  to="/admin/users" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === '/admin/users' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Users
                </Link>
              </>
            )}
            <Link 
              to="/notes" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/notes' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Notes
            </Link>
            <Link 
              to="/downloads" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/downloads' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Downloads
            </Link>
            <Link 
              to="/settings" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/settings' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;