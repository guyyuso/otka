import React, { useState, useEffect } from 'react';
import { Settings, Save, Lock, Globe, AlertTriangle } from 'lucide-react';
import Header from '../../components/Header';
import { adminApi } from '../../lib/api';

const SystemSettings: React.FC = () => {
    const [settings, setSettings] = useState<any>({
        general: { maintenanceMode: false, allowRegistration: true },
        security: { maxLoginAttempts: 5, sessionTimeout: 60 }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getSettings();
            // Ensure defaults if empty
            setSettings((prev: any) => ({ ...prev, ...data }));
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneralChange = (key: string, value: any) => {
        setSettings((prev: any) => ({
            ...prev,
            general: { ...prev.general, [key]: value }
        }));
    };

    const handleSecurityChange = (key: string, value: any) => {
        setSettings((prev: any) => ({
            ...prev,
            security: { ...prev.security, [key]: value }
        }));
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            setMessage(null);

            // Save generalized settings separately if needed, passing the whole object for each key
            await Promise.all([
                adminApi.updateSettings('general', settings.general),
                adminApi.updateSettings('security', settings.security)
            ]);

            setMessage({ type: 'success', text: 'Settings saved successfully' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <main className="container mx-auto px-4 py-8 text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading settings...</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Settings className="mr-2 text-gray-700" />
                            System Settings
                        </h1>
                        <p className="text-gray-600">Configure global application parameters</p>
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {message.type === 'error' && <AlertTriangle className="w-5 h-5 mr-2" />}
                        {message.text}
                    </div>
                )}

                <div className="space-y-6">
                    {/* General Settings */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                            <Globe className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-medium text-gray-900 ml-2">General Configuration</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-medium text-gray-900">User Registration</h3>
                                    <p className="text-sm text-gray-500">Allow new users to create accounts</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.general?.allowRegistration}
                                        onChange={(e) => handleGeneralChange('allowRegistration', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div>
                                    <h3 className="text-base font-medium text-gray-900">Maintenance Mode</h3>
                                    <p className="text-sm text-gray-500">Prevent non-admin users from logging in</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.general?.maintenanceMode}
                                        onChange={(e) => handleGeneralChange('maintenanceMode', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                            <Lock className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-medium text-gray-900 ml-2">Security Parameters</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Login Attempts
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={settings.security?.maxLoginAttempts || 5}
                                    onChange={(e) => handleSecurityChange('maxLoginAttempts', parseInt(e.target.value))}
                                    className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 max-w-xs"
                                />
                                <p className="mt-1 text-xs text-gray-500">Lockout account after N failed attempts (requires restart to clear)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Session Timeout (Minutes)
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="1440"
                                    value={settings.security?.sessionTimeout || 60}
                                    onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                                    className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 max-w-xs"
                                />
                                <p className="mt-1 text-xs text-gray-500">Auto-logout inactive users after this time</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SystemSettings;
