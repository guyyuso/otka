import React, { useState, useEffect } from 'react';
import { User, Search, MoreVertical, Shield, Ban, Trash, Edit, Grid, X } from 'lucide-react';
import Header from '../../components/Header';
import { usersApi, adminApi } from '../../lib/api';
import { User as UserType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const UsersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [managingUser, setManagingUser] = useState<UserType | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'super_admin') => {
    try {
      await usersApi.update(userId, { role: newRole });
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      await usersApi.update(userId, { status: newStatus });
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await usersApi.delete(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const UserActionMenu: React.FC<{ user: UserType }> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { isSuperAdmin, isAdmin } = useAuth();
    const canManageUser = isSuperAdmin() || (isAdmin() && user.role === 'user');

    if (!canManageUser) return null;

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-gray-500 p-1"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1" role="menu">
              <button
                onClick={() => {
                  setSelectedUser(user);
                  setShowEditModal(true);
                  setIsOpen(false);
                }}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <Edit className="mr-2 w-4 h-4 text-blue-500" />
                Edit Details
              </button>

              <button
                onClick={() => {
                  setManagingUser(user);
                  setShowAppsModal(true);
                  setIsOpen(false);
                }}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <Grid className="mr-2 w-4 h-4 text-indigo-500" />
                Manage Apps
              </button>

              {isSuperAdmin() && (
                <>
                  <button
                    onClick={() => {
                      updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin');
                      setIsOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Shield className="mr-2 w-4 h-4 text-purple-500" />
                    {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => {
                      updateUserRole(user.id, user.role === 'super_admin' ? 'admin' : 'super_admin');
                      setIsOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Shield className="mr-2 w-4 h-4 text-red-600" />
                    {user.role === 'super_admin' ? 'Remove Super Admin' : 'Make Super Admin'}
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  updateUserStatus(user.id, user.status === 'active' ? 'suspended' : 'active');
                  setIsOpen(false);
                }}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <Ban className="mr-2 w-4 h-4 text-orange-500" />
                {user.status === 'active' ? 'Suspend User' : 'Activate User'}
              </button>

              <button
                onClick={() => {
                  deleteUser(user.id);
                  setIsOpen(false);
                }}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <Trash className="mr-2 w-4 h-4" />
                Delete User
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const UserAppsModal: React.FC = () => {
    const [assignedApps, setAssignedApps] = useState<any[]>([]);
    const [availableApps, setAvailableApps] = useState<any[]>([]);
    const [selectedAppId, setSelectedAppId] = useState('');
    const [creds, setCreds] = useState({ username: '', pin: '' });
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [pinError, setPinError] = useState('');

    useEffect(() => {
      if (managingUser && showAppsModal) {
        loadData();
      }
    }, [managingUser, showAppsModal]);

    const loadData = async () => {
      if (!managingUser) return;
      setLoadingAssignments(true);
      try {
        const [assignments, allApps] = await Promise.all([
          adminApi.getUserAssignments(managingUser.id),
          adminApi.getAppTiles()
        ]);
        setAssignedApps(assignments);
        // Filter out apps already assigned
        const assignedIds = new Set(assignments.map((a: any) => a.app_id));
        setAvailableApps(allApps.filter((a: any) => !assignedIds.has(a.id)));
      } catch (error) {
        console.error('Error loading user apps:', error);
      } finally {
        setLoadingAssignments(false);
      }
    };

    const handleAssign = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!managingUser || !selectedAppId) return;

      // Validate PIN
      if (creds.pin && !/^\d{4}$/.test(creds.pin)) {
        setPinError('PIN must be exactly 4 digits');
        return;
      }
      setPinError('');

      try {
        await adminApi.assignAppToUser(managingUser.id, selectedAppId, {
          appUsername: creds.username,
          pin4: creds.pin,
          requiresPin: !!creds.pin
        });
        setCreds({ username: '', pin: '' });
        setSelectedAppId('');
        loadData();
        alert('App assigned successfully!');
      } catch (error) {
        console.error('Failed to assign app:', error);
        alert('Failed to assign app');
      }
    };

    const handleUnassign = async (appId: string) => {
      if (!managingUser || !window.confirm('Remove this app from user?')) return;
      try {
        await adminApi.unassignAppFromUser(managingUser.id, appId);
        loadData();
      } catch (error) {
        console.error('Failed to unassign app:', error);
      }
    };

    if (!showAppsModal || !managingUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Manage Apps</h2>
              <p className="text-sm text-gray-600">Assign applications to {managingUser.name}</p>
            </div>
            <button onClick={() => setShowAppsModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {/* Assign New App Form */}
            <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Assign New App</h3>
              <form onSubmit={handleAssign} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Select Application</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={selectedAppId}
                    onChange={e => setSelectedAppId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose App --</option>
                    {availableApps.map(app => (
                      <option key={app.id} value={app.id}>{app.name} ({app.auth_type})</option>
                    ))}
                  </select>
                </div>

                {/* Conditional Credential Fields based on selection? 
                    For simplicity, we show them always or if auth_type != 'none'.
                    Since we don't have auth_type in state easily without lookup, showing always for now. 
                */}
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-500 mb-1">App Username (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={creds.username}
                    onChange={e => setCreds({ ...creds, username: e.target.value })}
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-500 mb-1">4-Digit PIN</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="****"
                    className={`w-full px-3 py-2 border rounded-lg text-sm font-mono tracking-widest text-center ${pinError ? 'border-red-500' : 'border-gray-300'}`}
                    value={creds.pin}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCreds({ ...creds, pin: value });
                    }}
                  />
                  {pinError && <p className="text-red-500 text-xs mt-1">{pinError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={!selectedAppId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Assign
                </button>
              </form>
            </div>

            {/* Assigned Apps List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Assigned Applications</h3>
              {loadingAssignments ? (
                <div className="text-center py-4 text-gray-500">Loading assignments...</div>
              ) : assignedApps.length === 0 ? (
                <p className="text-gray-500 italic">No applications assigned yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedApps.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-white">
                      <div className="flex items-center">
                        {app.logo_url ? (
                          <img src={app.logo_url} className="w-8 h-8 rounded object-contain mr-3 bg-gray-50" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600 font-bold">
                            {app.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{app.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{app.auth_type} Auth</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassign(app.app_id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove Assignment"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button onClick={() => setShowAppsModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditUserModal: React.FC = () => {
    const { isSuperAdmin } = useAuth();
    const [formData, setFormData] = useState({
      name: selectedUser?.name || '',
      role: selectedUser?.role || 'user',
      status: selectedUser?.status || 'active'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser) return;

      try {
        await usersApi.update(selectedUser.id, {
          fullName: formData.name,
          role: formData.role,
          status: formData.status
        });
        await fetchUsers();
        setShowEditModal(false);
        setSelectedUser(null);
      } catch (error) {
        console.error('Error updating user:', error);
      }
    };

    if (!showEditModal || !selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
            <button
              onClick={() => setShowEditModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full py-3 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' | 'super_admin' })}
                disabled={!isSuperAdmin()}
                className="block w-full py-3 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                {isSuperAdmin() && <option value="super_admin">Super Admin</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                className="block w-full py-3 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users and permissions</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {user.status === 'active' ? 'Active' :
                            user.status === 'suspended' ? 'Suspended' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <UserActionMenu user={user} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <EditUserModal />
        <UserAppsModal />
      </main>
    </div>
  );
};

export default UsersManagement;