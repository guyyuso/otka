import React, { useState } from 'react';
import { X, Plus, Globe, User, Lock, Image } from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddAppModal: React.FC<AddAppModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    logo: '',
    username: '',
    password: '',
    category: 'general'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addApp } = useAppData();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('שם האפליקציה הוא שדה חובה');
      return false;
    }
    if (!formData.url.trim()) {
      setError('כתובת URL היא שדה חובה');
      return false;
    }
    try {
      new URL(formData.url);
    } catch {
      setError('כתובת URL לא תקינה');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await addApp(formData);
      setFormData({
        name: '',
        url: '',
        logo: '',
        username: '',
        password: '',
        category: 'general'
      });
      onClose();
    } catch (err) {
      setError('שגיאה בהוספת האפליקציה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      url: '',
      logo: '',
      username: '',
      password: '',
      category: 'general'
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">הוסף אפליקציה חדשה</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              שם האפליקציה *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Plus className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="block w-full pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="למשל: Gmail, Slack, Office 365"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              כתובת URL *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="url"
                name="url"
                type="url"
                required
                className="block w-full pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://example.com"
                value={formData.url}
                onChange={handleChange}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
              כתובת לוגו (אופציונלי)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Image className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="logo"
                name="logo"
                type="url"
                className="block w-full pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://example.com/logo.png"
                value={formData.logo}
                onChange={handleChange}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              שם משתמש (אופציונלי)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                className="block w-full pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="שם משתמש או אימייל"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה (אופציונלי)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                className="block w-full pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              קטגוריה
            </label>
            <select
              id="category"
              name="category"
              className="block w-full py-3 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="general">כללי</option>
              <option value="productivity">פרודוקטיביות</option>
              <option value="communication">תקשורת</option>
              <option value="development">פיתוח</option>
              <option value="design">עיצוב</option>
              <option value="finance">כספים</option>
              <option value="hr">משאבי אנוש</option>
              <option value="marketing">שיווק</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                'הוסף אפליקציה'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppModal;