import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import NotesPage from './pages/NotesPage';
import DownloadsPage from './pages/DownloadsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import AdminLogs from './pages/admin/AdminLogs';
import SystemSettings from './pages/admin/SystemSettings';
import AppsCatalog from './pages/admin/AppsCatalog';
import AppRequests from './pages/admin/AppRequests';
import UserActivity from './pages/admin/UserActivity';
import ManageAccess from './pages/admin/ManageAccess';
import Store from './pages/Store';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SuperAdminRoute from './components/SuperAdminRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppDataProvider>
          <div className="app">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes"
                element={
                  <ProtectedRoute>
                    <NotesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/downloads"
                element={
                  <ProtectedRoute>
                    <DownloadsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <UsersManagement />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/apps"
                element={
                  <AdminRoute>
                    <AppsCatalog />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/requests"
                element={
                  <AdminRoute>
                    <AppRequests />
                  </AdminRoute>
                }
              />
              <Route
                path="/store"
                element={
                  <ProtectedRoute>
                    <Store />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <SuperAdminRoute>
                    <AdminLogs />
                  </SuperAdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <SuperAdminRoute>
                    <SystemSettings />
                  </SuperAdminRoute>
                }
              />
              <Route
                path="/admin/activity"
                element={
                  <AdminRoute>
                    <UserActivity />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/access"
                element={
                  <AdminRoute>
                    <ManageAccess />
                  </AdminRoute>
                }
              />
            </Routes>
          </div>
        </AppDataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;