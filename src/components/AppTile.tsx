import React, { useState, useRef } from 'react';
import { MoreVertical, Link as LinkIcon, Edit, Key, Trash, ExternalLink, Copy } from 'lucide-react';
import { AppData } from '../types';
import { useAppData } from '../contexts/AppDataContext';
import useClickOutside from '../hooks/useClickOutside';

interface AppTileProps {
  app: AppData;
}

const AppTile: React.FC<AppTileProps> = ({ app }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { removeApp, updateLastUsed } = useAppData();
  
  useClickOutside(menuRef, () => {
    if (menuOpen) setMenuOpen(false);
  });

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleAppClick = async () => {
    if (!editMode) {
      await updateLastUsed(app.id);
      
      // Show credentials if available
      if (app.username || app.password) {
        setShowCredentials(true);
        // Auto-hide after 5 seconds
        setTimeout(() => setShowCredentials(false), 5000);
      }
      
      window.open(app.url, '_blank');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditMode(true);
    setMenuOpen(false);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this application?')) {
      await removeApp(app.id);
    }
    setMenuOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm overflow-hidden relative transition-all duration-200 cursor-pointer ${
        editMode ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
      }`}
      onClick={handleAppClick}
    >
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={toggleMenu}
            className="p-1 rounded-full bg-white/90 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          
          {menuOpen && (
            <div 
              ref={menuRef}
              className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10"
              onClick={e => e.stopPropagation()}
            >
              <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <LinkIcon size={16} className="mr-2 text-blue-500" />
                <span>Change URL</span>
              </button>
              <button 
                onClick={handleEditClick}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit size={16} className="mr-2 text-green-500" />
                <span>Edit Details</span>
              </button>
              <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Key size={16} className="mr-2 text-orange-500" />
                <span>Update Password</span>
              </button>
              <button 
                onClick={handleDeleteClick}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
              >
                <Trash size={16} className="mr-2" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 flex items-center justify-center h-32">
          {app.logo ? (
            <img 
              src={app.logo} 
              alt={app.name} 
              className="max-h-16 max-w-32 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center ${app.logo ? 'hidden' : ''}`}>
            <span className="text-blue-600 font-semibold text-lg">
              {app.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate">{app.name}</h3>
          {!editMode && (
            <ExternalLink size={14} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Credentials popup */}
      {showCredentials && (app.username || app.password) && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20 rounded-xl">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs w-full mx-4">
            <h4 className="font-semibold text-gray-900 mb-3">Credentials</h4>
            {app.username && (
              <div className="mb-2">
                <label className="text-xs text-gray-500">Username</label>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm font-mono">{app.username}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(app.username);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}
            {app.password && (
              <div className="mb-3">
                <label className="text-xs text-gray-500">Password</label>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm font-mono">••••••••</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(app.password || '');
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCredentials(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppTile;