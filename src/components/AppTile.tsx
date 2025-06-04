import React, { useState, useRef } from 'react';
import { MoreVertical, Link as LinkIcon, Edit, Key, Trash, ExternalLink } from 'lucide-react';
import { AppData } from '../types';
import useClickOutside from '../hooks/useClickOutside';

interface AppTileProps {
  app: AppData;
}

const AppTile: React.FC<AppTileProps> = ({ app }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(menuRef, () => {
    if (menuOpen) setMenuOpen(false);
  });

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleAppClick = () => {
    if (!editMode) {
      window.open(app.url, '_blank');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditMode(true);
    setMenuOpen(false);
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm overflow-hidden relative transition-all duration-200 ${
        editMode ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
      }`}
      onClick={handleAppClick}
    >
      <div className="relative">
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={toggleMenu}
            className="p-1 rounded-full bg-white/90 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          
          {menuOpen && (
            <div 
              ref={menuRef}
              className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10"
              onClick={e => e.stopPropagation()}
            >
              <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <LinkIcon size={16} className="ml-2 text-blue-500" />
                <span>שנה URL</span>
              </button>
              <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Edit size={16} className="ml-2 text-green-500" />
                <span>ערוך פרטים</span>
              </button>
              <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Key size={16} className="ml-2 text-orange-500" />
                <span>עדכן סיסמה</span>
              </button>
              <button className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100">
                <Trash size={16} className="ml-2" />
                <span>הסר</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 flex items-center justify-center h-32">
          <img 
            src={app.logo} 
            alt={app.name} 
            className="max-h-16 max-w-32 object-contain"
          />
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
    </div>
  );
};

export default AppTile;