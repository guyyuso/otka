import React, { useState, useEffect } from 'react';
import { Users, Activity, Clock, Wifi, WifiOff, Coffee } from 'lucide-react';
import Header from '../../components/Header';
import { adminApi } from '../../lib/api';

interface LiveUser {
    userId: string;
    email: string;
    fullName: string;
    role: string;
    sessionDurationSeconds: number;
    presenceState: 'LIVE' | 'AWAY' | 'OFFLINE';
    loginAt: string;
    lastAppName?: string;
    lastAppOpenedAt?: string;
}

const UserActivity: React.FC = () => {
    const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
    const [counts, setCounts] = useState({ LIVE: 0, AWAY: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        fetchData();

        let interval: any;
        if (autoRefresh) {
            interval = setInterval(fetchData, 5000); // 5 second polling
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const fetchData = async () => {
        try {
            const data = await (adminApi as any).getAnalyticsLiveUsers?.()
                || await fetch('/api/admin/analytics/user-activity/live', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                }).then(r => r.json());

            setLiveUsers(data.liveUsers || []);
            setCounts(data.counts || { LIVE: 0, AWAY: 0, total: 0 });
        } catch (error) {
            console.error('Error fetching live users:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getPresenceIcon = (state: string) => {
        switch (state) {
            case 'LIVE': return <Wifi className="w-4 h-4 text-green-500" />;
            case 'AWAY': return <Coffee className="w-4 h-4 text-yellow-500" />;
            default: return <WifiOff className="w-4 h-4 text-gray-400" />;
        }
    };

    const getPresenceBadge = (state: string) => {
        const colors: Record<string, string> = {
            LIVE: 'bg-green-100 text-green-700',
            AWAY: 'bg-yellow-100 text-yellow-700',
            OFFLINE: 'bg-gray-100 text-gray-500'
        };
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[state]}`}>
                {getPresenceIcon(state)}
                <span className="ml-1">{state}</span>
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Activity className="mr-2 text-blue-600" />
                            User Activity
                        </h1>
                        <p className="text-gray-600">Live presence and session tracking</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors ${autoRefresh
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                        >
                            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
                            {autoRefresh ? 'Live (5s)' : 'Paused'}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Live Users</p>
                                <p className="text-3xl font-bold text-green-600">{counts.LIVE}</p>
                            </div>
                            <Wifi className="w-10 h-10 text-green-200" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Away</p>
                                <p className="text-3xl font-bold text-yellow-600">{counts.AWAY}</p>
                            </div>
                            <Coffee className="w-10 h-10 text-yellow-200" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Sessions</p>
                                <p className="text-3xl font-bold text-blue-600">{counts.total}</p>
                            </div>
                            <Users className="w-10 h-10 text-blue-200" />
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : liveUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No active users at this time
                                    </td>
                                </tr>
                            ) : (
                                liveUsers.map(user => (
                                    <tr key={user.userId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getPresenceBadge(user.presenceState)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {formatDuration(user.sessionDurationSeconds)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.loginAt).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                {user.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default UserActivity;
