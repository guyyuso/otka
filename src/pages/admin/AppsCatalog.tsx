import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Shield, Globe, Users, X, RefreshCw } from 'lucide-react';
import Header from '../../components/Header';
import { adminApi, usersApi, storeSyncApi } from '../../lib/api';
import UserSearchAutocomplete from '../../components/UserSearchAutocomplete';

interface AppTile {
    id: string;
    name: string;
    description: string;
    category: string;
    logo_url: string;
    launch_url: string;
    auth_type: string;
    config: Record<string, unknown>;
}

const AppsCatalog: React.FC = () => {
    const [apps, setApps] = useState<AppTile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<AppTile | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logo_url: '',
        launch_url: '',
        auth_type: 'none'
    });
    const [managingApp, setManagingApp] = useState<AppTile | null>(null);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<{ catalog_apps: number; store_apps: number; unsynced: number } | null>(null);

    useEffect(() => {
        fetchApps();
        fetchSyncStatus();
    }, []);

    const fetchSyncStatus = async () => {
        try {
            const status = await storeSyncApi.getStatus();
            setSyncStatus(status);
        } catch (error) {
            console.error('Error fetching sync status:', error);
        }
    };

    const handleSync = async () => {
        if (!window.confirm('This will make all active catalog apps available in the store. Continue?')) {
            return;
        }

        setSyncing(true);
        try {
            const result = await storeSyncApi.sync();
            alert(`Successfully synced ${result.apps_synced} apps to the store!`);
            fetchSyncStatus();
        } catch (error) {
            alert('Failed to sync store. Please try again.');
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
        }
    };

    const fetchApps = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getAppTiles();
            setApps(data);
        } catch {
            // Silent error - apps list will be empty
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData };

            if (editingApp) {
                await adminApi.updateAppTile(editingApp.id, payload);
            } else {
                await adminApi.createAppTile(payload);
            }
            fetchApps();
            closeModal();
        } catch {
            alert('Failed to save app. Check config JSON validity.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this app tile?')) return;
        try {
            await adminApi.deleteAppTile(id);
            fetchApps();
        } catch {
            // Silent error
        }
    };

    const openModal = (app?: AppTile) => {
        if (app) {
            setEditingApp(app);
            setFormData({
                name: app.name,
                description: app.description || '',
                logo_url: app.logo_url || '',
                launch_url: app.launch_url,
                auth_type: app.auth_type || 'none'
            });
        } else {
            setEditingApp(null);
            setFormData({
                name: '',
                description: '',
                logo_url: '',
                launch_url: '',
                auth_type: 'none'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingApp(null);
    };

    const openUsersModal = (app: AppTile) => {
        setManagingApp(app);
        setShowUsersModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Application Catalog</h1>
                        <p className="text-gray-600">Manage global application tiles available for assignment</p>
                        {syncStatus && (
                            <p className="text-sm text-gray-500 mt-1">
                                {syncStatus.catalog_apps} apps in catalog • {syncStatus.store_apps} in store
                                {syncStatus.unsynced > 0 && (
                                    <span className="text-orange-600 ml-2">({syncStatus.unsynced} not synced)</span>
                                )}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            title="Sync all active apps to store"
                        >
                            <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync to Store'}
                        </button>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add New App
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.map((app) => (
                        <div key={app.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center">
                                        {app.logo_url ? (
                                            <img src={app.logo_url} alt={app.name} className="w-12 h-12 rounded-lg object-contain bg-gray-50 p-1" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Globe className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="ml-3">
                                            <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{app.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => openUsersModal(app)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Manage Users">
                                            <Users className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openModal(app)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(app.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden text-ellipsis">{app.description}</p>
                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        <a href={app.launch_url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[200px]">
                                            {app.launch_url}
                                        </a>
                                    </div>
                                    <div className="flex items-center">
                                        <Shield className="w-4 h-4 mr-2" />
                                        <span className="capitalize">{app.auth_type} Auth</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {apps.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No applications defined yet.</p>
                            <button onClick={() => openModal()} className="text-blue-600 hover:underline mt-2">Create the first one</button>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{editingApp ? 'Edit Application' : 'New Application'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Launch URL</label>
                                <input
                                    type="url"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.launch_url}
                                    onChange={e => setFormData({ ...formData, launch_url: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Auth Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.auth_type}
                                        onChange={e => setFormData({ ...formData, auth_type: e.target.value })}
                                    >
                                        <option value="none">None (Public)</option>
                                        <option value="password">Username/Password</option>
                                        <option value="sso">SSO / SAML</option>
                                        <option value="token">API Token</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.logo_url}
                                        onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Application</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showUsersModal && managingApp && (
                <AppUsersModal app={managingApp} onClose={() => setShowUsersModal(false)} />
            )}
        </div>
    );
};

interface AssignedUser {
    id: string;
    full_name?: string;
    email: string;
}


interface UserOption {
    id: string;
    name: string;
    email: string;
    role: string;
}

// App Username Input with User Search Suggestions
const AppUsernameInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<UserOption[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const users = await usersApi.search(query, 5);
                setSuggestions(users);
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    const handleSelect = (user: UserOption) => {
        // Suggest username based on email or name
        const suggestedUsername = user.email.split('@')[0] || user.name.toLowerCase().replace(/\s+/g, '.');
        onChange(suggestedUsername);
        setQuery(suggestedUsername);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange(e.target.value);
                }}
                onFocus={() => {
                    if (suggestions.length > 0) {
                        setShowSuggestions(true);
                    }
                }}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                        User Suggestions (click to use as username)
                    </div>
                    {suggestions.map((user) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelect(user)}
                            className="w-full flex items-center px-4 py-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Suggested: {user.email.split('@')[0]}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const AppUsersModal: React.FC<{ app: AppTile, onClose: () => void }> = ({ app, onClose }) => {
    const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
    const [creds, setCreds] = useState({ appUsername: '', pin4: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [app]);

    const loadData = async () => {
        setLoading(true);
        try {
            const assignments = await adminApi.getAppAssignedUsers(app.id);
            setAssignedUsers(assignments);
        } catch {
            // Silent error
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser?.id) {
            alert('Please select a user');
            return;
        }
        try {
            await adminApi.assignAppToUser(selectedUser.id, app.id, creds);
            setSelectedUser(null);
            setCreds({ appUsername: '', pin4: '' });
            loadData();
        } catch {
            alert('Failed to assign user');
        }
    };

    const handleUnassign = async (userId: string) => {
        if (!window.confirm('Remove access for this user?')) return;
        try {
            await adminApi.unassignAppFromUser(userId, app.id);
            loadData();
        } catch {
            // Silent error
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Access</h2>
                        <p className="text-sm text-gray-600">Users assigned to {app.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Add User Access</h3>
                        <form onSubmit={handleAssign} className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Select User</label>
                                <UserSearchAutocomplete
                                    onSelect={setSelectedUser}
                                    selectedUser={selectedUser}
                                    onClear={() => setSelectedUser(null)}
                                    placeholder="Type to search users by name or email..."
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-medium text-gray-500 mb-1">App Username (Optional)</label>
                                <AppUsernameInput
                                    value={creds.appUsername}
                                    onChange={(value) => setCreds({ ...creds, appUsername: value })}
                                    placeholder="Enter username or search users..."
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-medium text-gray-500 mb-1">4-Digit PIN (Optional)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{4}"
                                    maxLength={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono tracking-widest text-center"
                                    value={creds.pin4}
                                    onChange={e => setCreds({ ...creds, pin4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!selectedUser?.id}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Assign
                            </button>
                        </form>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Assigned Users</h3>
                        {loading ? (
                            <div className="text-center py-4">Loading...</div>
                        ) : assignedUsers.length === 0 ? (
                            <p className="text-gray-500 italic">No users assigned yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {assignedUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600 font-bold">
                                                {user.full_name?.charAt(0) || user.email.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{user.full_name || user.email}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnassign(user.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                                            title="Remove Access"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppsCatalog;
