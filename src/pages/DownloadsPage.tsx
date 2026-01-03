import React, { useState, useEffect } from 'react';
import { Download, File } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

// Note: File upload functionality requires additional server-side setup
// This is a placeholder that shows the UI but file uploads are disabled

const DownloadsPage: React.FC = () => {
  const [files] = useState<any[]>([]);
  const [isLoading] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Download className="w-6 h-6 mr-2 text-blue-600" />
              Downloads
            </h1>
            <p className="text-gray-600">Manage your uploaded files</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <File className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
            <p className="text-gray-600 mb-6">File upload functionality requires additional server configuration</p>
            <p className="text-sm text-gray-500">
              To enable file uploads, configure the server with file storage (e.g., local storage or S3)
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <p className="p-4 text-gray-500">Files will be displayed here</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DownloadsPage;