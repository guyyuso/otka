import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Download, Clock, User, Activity } from 'lucide-react';
import Header from '../../components/Header';
import { adminApi } from '../../lib/api';

interface AuditLog {
    id: string;
    actor_id: string;
    actor_name?: string;
    actor_email?: string;
    action: string;
    target_id: string;
    details: Record<string, unknown>;
    ip_address: string;
    created_at: string;
}

const AdminLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);

    useEffect(() => {
        fetchLogs();

        let interval: ReturnType<typeof setInterval> | undefined;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getLogs();
            if (Array.isArray(data.logs)) {
                const parsed = data.logs.map((log: string, idx: number) => {
                    const match = log.match(/\[(\w+)\]\s+(.+?)\s+-\s+(.+)/);
                    return {
                        id: `log-${idx}`,
                        action: match ? match[1] : 'INFO',
                        created_at: match ? new Date(match[2]).toISOString() : new Date().toISOString(),
                        details: { message: match ? match[3] : log },
                        actor_name: 'System',
                        ip_address: '-'
                    };
                });
                setLogs(parsed);
            }
        } catch {
            // Silent error
        } finally {
            setLoading(false);
        }
    };

    const downloadLogs = () => {
        const content = logs.map(log =>
            `[${log.action}] ${new Date(log.created_at).toISOString()} - ${JSON.stringify(log.details)}`
        ).join('\n');
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `audit-logs-${new Date().toISOString()}.log`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const getActionBadge = (action: string) => {
        let color = 'bg-gray-100 text-gray-700';
        if (action.includes('ERROR')) color = 'bg-red-100 text-red-700';
        else if (action.includes('WARN')) color = 'bg-yellow-100 text-yellow-700';
        else if (action.includes('create') || action.includes('add')) color = 'bg-green-100 text-green-700';
        else if (action.includes('delete') || action.includes('remove')) color = 'bg-red-100 text-red-700';
        else if (action.includes('update') || action.includes('edit')) color = 'bg-blue-100 text-blue-700';

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                {action}
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
                            <Shield className="mr-2 text-blue-600" />
                            Security Audit
                        </h1>
                        <p className="text-gray-600">System activity and audit trail</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors ${autoRefresh
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
                        </button>
                        <button
                            onClick={fetchLogs}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={downloadLogs}
                            className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm font-medium hover:bg-blue-700 flex items-center"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No audit logs found</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="ml-2 text-sm text-gray-900">{log.actor_name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 max-w-xs truncate" title={JSON.stringify(log.details)}>
                                                {String(log.details?.message || JSON.stringify(log.details).slice(0, 50))}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.ip_address || '-'}
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

export default AdminLogs;
