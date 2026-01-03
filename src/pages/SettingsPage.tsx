import React, { useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../lib/api';
import {
  Shield,
  Lock,
  Bell,
  UserCog,
  X,
  Check,
  Eye,
  EyeOff,
  Key,
  Copy
} from 'lucide-react';

// Password Generator Modal
const PasswordGeneratorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Key className="w-5 h-5 mr-2 text-green-600" />
            Password Generator
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={password}
              readOnly
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              placeholder="Click generate to create password"
            />
            <button
              onClick={copyToClipboard}
              className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
              disabled={!password}
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Length: {length}
            </label>
            <input
              type="range"
              min="8"
              max="32"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include uppercase letters</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include numbers</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include symbols</span>
            </label>
          </div>

          <button
            onClick={generatePassword}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Generate Password
          </button>
        </div>
      </div>
    </div>
  );
};

// Profile Edit Modal
const ProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; user: any }> = ({ isOpen, onClose, user }) => {
  const [fullName, setFullName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await usersApi.update(user.id, { fullName });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        window.location.reload(); // Refresh to get updated user info
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">Profile updated successfully!</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Settings Modal
const NotificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save to localStorage for now (would be API in production)
    localStorage.setItem('notifications', JSON.stringify({ loginAlerts, securityAlerts, systemUpdates }));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-yellow-600" />
            Notification Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {saved && (
            <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">Settings saved!</div>
          )}
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Login Alerts</span>
              <input
                type="checkbox"
                checked={loginAlerts}
                onChange={(e) => setLoginAlerts(e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Security Alerts</span>
              <input
                type="checkbox"
                checked={securityAlerts}
                onChange={(e) => setSecurityAlerts(e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">System Updates</span>
              <input
                type="checkbox"
                checked={systemUpdates}
                onChange={(e) => setSystemUpdates(e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
            </label>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleSettingClick = (settingId: string) => {
    switch (settingId) {
      case 'generate':
        setActiveModal('generator');
        break;
      case 'profile':
        setActiveModal('profile');
        break;
      case 'login-alerts':
      case 'security-alerts':
      case 'updates':
        setActiveModal('notifications');
        break;
      default:
        alert(`${settingId} feature coming soon!`);
    }
  };

  const settingsSections = [
    {
      id: 'security',
      title: 'Security',
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      items: [
        { id: 'password', label: 'Change Password', status: 'coming-soon' },
        { id: 'mfa', label: 'Two-Factor Authentication', status: 'coming-soon' },
        { id: 'sessions', label: 'Connected Devices', status: 'coming-soon' }
      ]
    },
    {
      id: 'passwords',
      title: 'Password Management',
      icon: <Lock className="w-5 h-5 text-green-600" />,
      items: [
        { id: 'generate', label: 'Generate Strong Password', status: 'active' },
        { id: 'audit', label: 'Password Strength Audit', status: 'coming-soon' },
        { id: 'export', label: 'Export Passwords', status: 'coming-soon' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell className="w-5 h-5 text-yellow-600" />,
      items: [
        { id: 'login-alerts', label: 'Login Alerts', status: 'active' },
        { id: 'security-alerts', label: 'Security Alerts', status: 'active' },
        { id: 'updates', label: 'System Updates', status: 'active' }
      ]
    },
    {
      id: 'account',
      title: 'Account',
      icon: <UserCog className="w-5 h-5 text-gray-600" />,
      items: [
        { id: 'profile', label: 'Profile Details', status: 'active' },
        { id: 'preferences', label: 'Preferences', status: 'coming-soon' },
        { id: 'delete-account', label: 'Delete Account', status: 'danger' }
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
                    onClick={() => handleSettingClick(item.id)}
                    className={`w-full px-6 py-4 flex items-center justify-between transition-colors text-left ${item.status === 'danger'
                        ? 'hover:bg-red-50 text-red-600'
                        : 'hover:bg-blue-50 text-gray-800'
                      }`}
                  >
                    <span>{item.label}</span>
                    <div className="flex items-center">
                      {item.status === 'coming-soon' && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded mr-2">Soon</span>
                      )}
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <PasswordGeneratorModal
        isOpen={activeModal === 'generator'}
        onClose={() => setActiveModal(null)}
      />
      <ProfileModal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
        user={user}
      />
      <NotificationModal
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};

export default SettingsPage;