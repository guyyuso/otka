import React, { useState, useEffect } from 'react';
import { Trash, Shield, Grid } from 'lucide-react';
import Header from '../../components/Header';
import UserSearchAutocomplete from '../../components/UserSearchAutocomplete';
import { adminApi } from '../../lib/api';

interface UserOption {
    id: string;
    name: string;
    email: string;
    role: string;
}

const ManageAccess: React.FC = () => {
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
    const [assignedApps, setAssignedApps] = useState<any[]>([]);
    const [availableApps, setAvailableApps] = useState<any[]>([]);
    const [selectedAppId, setSelectedAppId] = useState('');
    const [creds, setCreds] = useState({ username: '', pin: '' });
    const [loading, setLoading] = useState(false);
    const [pinError, setPinError] = useState('');

    useEffect(() => {
        if (selectedUser) {
            loadUserApps();
        } else {
            setAssignedApps([]);
            setAvailableApps([]);
        }
    }, [selectedUser]);

    const loadUserApps = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            const [assignments, allApps] = await Promise.all([
                adminApi.getUserAssignments(selectedUser.id),
                adminApi.getAppTiles()
            ]);
            setAssignedApps(assignments);
            const assignedIds = new Set(assignments.map((a: any) => a.app_id));
            setAvailableApps(allApps.filter((a: any) => !assignedIds.has(a.id)));
        } catch (error) {
            console.error('Error loading apps:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !selectedAppId) return;

        if (creds.pin && !/^\d{4}$/.test(creds.pin)) {
            setPinError('PIN must be exactly 4 digits');
            return;
        }
        setPinError('');

        try {
            await adminApi.assignAppToUser(selectedUser.id, selectedAppId, {
                appUsername: creds.username,
                pin4: creds.pin,
                requiresPin: !!creds.pin
            });
            setCreds({ username: '', pin: '' });
            setSelectedAppId('');
            loadUserApps();
            alert('App assigned successfully!');
        } catch (error) {
            console.error('Failed to assign app:', error);
            alert('Failed to assign app');
        }
    };

    const handleUnassign = async (appId: string) => {
        if (!selectedUser || !window.confirm('Remove this app from user?')) return;
        try {
            await adminApi.unassignAppFromUser(selectedUser.id, appId);
            loadUserApps();
        } catch (error) {
            console.error('Failed to unassign:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Shield className="w-6 h-6 mr-2 text-blue-600" />
                        Manage Access
                    </h1>
                    <p className="text-gray-600">Assign applications to users with PIN authentication</p>
                </div>

                {/* User Search */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Select User</h2>
                    <UserSearchAutocomplete
                        onSelect={setSelectedUser}
                        selectedUser={selectedUser}
                        onClear={() => setSelectedUser(null)}
                        placeholder="Type to search users by name or email..."
                    />
                </div>

                {selectedUser && (
                    <>
                        {/* Assign New App */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Application</h2>
                            <form onSubmit={handleAssign} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Application</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            value={selectedAppId}
                                            onChange={e => setSelectedAppId(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Choose App --</option>
                                            {availableApps.map(app => (
                                                <option key={app.id} value={app.id}>{app.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">App Username</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            value={creds.username}
                                            onChange={e => setCreds({ ...creds, username: e.target.value })}
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN</label>
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
                                </div>
                                <button
                                    type="submit"
                                    disabled={!selectedAppId}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Assign App
                                </button>
                            </form>
                        </div>

                        {/* Assigned Apps */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Grid className="w-5 h-5 mr-2 text-gray-600" />
                                Assigned Applications ({assignedApps.length})
                            </h2>

                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading...</div>
                            ) : assignedApps.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No applications assigned to this user yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {assignedApps.map(app => (
                                        <div key={app.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-white">
                                            <div className="flex items-center">
                                                {app.logo_url ? (
                                                    <img src={app.logo_url} className="w-10 h-10 rounded object-contain mr-3 bg-gray-50" alt="" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600 font-bold">
                                                        {app.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{app.name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{app.auth_type} Auth</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnassign(app.app_id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ManageAccess;
