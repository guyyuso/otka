import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye, MessageSquare, User, Grid } from 'lucide-react';
import Header from '../../components/Header';
import { adminApi } from '../../lib/api';

interface AppRequest {
    id: string;
    reason: string;
    status: 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'DENIED';
    admin_note: string;
    deny_reason: string;
    created_at: string;
    reviewed_at: string;
    user_id: string;
    user_email: string;
    user_name: string;
    app_id: string;
    app_name: string;
    app_identifier_or_name?: string;
    logo_url: string;
    icon_url: string;
    category: string;
    reviewed_by_name: string;
}

interface RequestsResponse {
    requests: AppRequest[];
    counts: Record<string, number>;
}

const AppRequests: React.FC = () => {
    const [data, setData] = useState<RequestsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedRequest, setSelectedRequest] = useState<AppRequest | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'deny' | null>(null);
    const [actionNote, setActionNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const result = await adminApi.getRequests(statusFilter || undefined);
            setData(result);
        } catch {
            // Silent error
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest || !actionType) return;

        if (actionType === 'deny' && !actionNote.trim()) {
            alert('Denial reason is required');
            return;
        }

        setSubmitting(true);
        try {
            if (actionType === 'approve') {
                await adminApi.approveRequest(selectedRequest.id, actionNote.trim() || undefined);
            } else {
                await adminApi.denyRequest(selectedRequest.id, actionNote.trim());
            }

            setSelectedRequest(null);
            setActionType(null);
            setActionNote('');
            fetchRequests();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to process request';
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };


    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            SUBMITTED: 'bg-indigo-100 text-indigo-800',
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            DENIED: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    if (loading && !data) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">App Requests</h1>
                        <p className="text-gray-600">Review and manage user app access requests</p>
                    </div>
                </div>

                {/* Stats */}
                {data?.counts && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <button
                            onClick={() => setStatusFilter('')}
                            className={`p-4 bg-white rounded-xl shadow-sm text-left hover:shadow-md transition-shadow ${!statusFilter ? 'ring-2 ring-blue-500' : ''}`}
                        >
                            <p className="text-sm text-gray-500">All Requests</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Object.values(data.counts).reduce((a, b) => a + b, 0)}
                            </p>
                        </button>
                        <button
                            onClick={() => setStatusFilter('PENDING')}
                            className={`p-4 bg-white rounded-xl shadow-sm text-left hover:shadow-md transition-shadow ${statusFilter === 'PENDING' ? 'ring-2 ring-yellow-500' : ''}`}
                        >
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{data.counts.PENDING || 0}</p>
                        </button>
                        <button
                            onClick={() => setStatusFilter('APPROVED')}
                            className={`p-4 bg-white rounded-xl shadow-sm text-left hover:shadow-md transition-shadow ${statusFilter === 'APPROVED' ? 'ring-2 ring-green-500' : ''}`}
                        >
                            <p className="text-sm text-gray-500">Approved</p>
                            <p className="text-2xl font-bold text-green-600">{data.counts.APPROVED || 0}</p>
                        </button>
                        <button
                            onClick={() => setStatusFilter('DENIED')}
                            className={`p-4 bg-white rounded-xl shadow-sm text-left hover:shadow-md transition-shadow ${statusFilter === 'DENIED' ? 'ring-2 ring-red-500' : ''}`}
                        >
                            <p className="text-sm text-gray-500">Denied</p>
                            <p className="text-2xl font-bold text-red-600">{data.counts.DENIED || 0}</p>
                        </button>
                    </div>
                )}

                {/* Requests Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data?.requests.map(req => (
                                <tr key={req.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">{req.user_name}</p>
                                                <p className="text-xs text-gray-500">{req.user_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {req.icon_url || req.logo_url ? (
                                                <img src={req.icon_url || req.logo_url} alt="" className="w-8 h-8 rounded object-contain bg-gray-50" />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <Grid className="w-4 h-4" />
                                                </div>
                                            )}
                                            <div className="ml-3">
                                                <div className="flex items-center">
                                                    <p className="text-sm font-medium text-gray-900">{req.app_name || req.app_identifier_or_name || 'Unknown App'}</p>
                                                    {!req.app_id && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded">Custom</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">{req.category || 'User Requested'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 max-w-xs truncate" title={req.reason}>
                                            {req.reason}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(req.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {['SUBMITTED', 'PENDING'].includes(req.status) ? (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setActionType('approve');
                                                    }}
                                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setActionType('deny');
                                                    }}
                                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                                >
                                                    Deny
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {data?.requests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No requests found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Action Modal */}
            {selectedRequest && actionType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {actionType === 'approve' ? 'Approve Request' : 'Deny Request'}
                            </h2>
                        </div>

                        <form onSubmit={handleAction} className="p-6">
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">User: <span className="font-medium text-gray-900">{selectedRequest.user_name}</span></p>
                                <p className="text-sm text-gray-500">App: <span className="font-medium text-gray-900">{selectedRequest.app_name}</span></p>
                                <p className="text-sm text-gray-500 mt-2">Reason:</p>
                                <p className="text-sm text-gray-700 italic">"{selectedRequest.reason}"</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {actionType === 'approve' ? 'Note (optional)' : 'Denial Reason *'}
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-24"
                                    placeholder={actionType === 'approve' ? 'Optional note for the user...' : 'Explain why this request is being denied...'}
                                    value={actionNote}
                                    onChange={e => setActionNote(e.target.value)}
                                    required={actionType === 'deny'}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRequest(null);
                                        setActionType(null);
                                        setActionNote('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${actionType === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {submitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Deny'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal (for already reviewed) */}
            {selectedRequest && !actionType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                            {getStatusBadge(selectedRequest.status)}
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">User</p>
                                    <p className="font-medium text-gray-900">{selectedRequest.user_name} ({selectedRequest.user_email})</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">App</p>
                                    <p className="font-medium text-gray-900">{selectedRequest.app_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">User's Reason</p>
                                    <p className="text-gray-700">"{selectedRequest.reason}"</p>
                                </div>
                                {selectedRequest.status === 'DENIED' && selectedRequest.deny_reason && (
                                    <div className="p-3 bg-red-50 rounded-lg">
                                        <p className="text-sm text-red-600 font-medium">Denial Reason</p>
                                        <p className="text-red-700">{selectedRequest.deny_reason}</p>
                                    </div>
                                )}
                                {selectedRequest.admin_note && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-600 font-medium">Admin Note</p>
                                        <p className="text-blue-700">{selectedRequest.admin_note}</p>
                                    </div>
                                )}
                                {selectedRequest.reviewed_by_name && (
                                    <div>
                                        <p className="text-sm text-gray-500">Reviewed By</p>
                                        <p className="font-medium text-gray-900">{selectedRequest.reviewed_by_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {selectedRequest.reviewed_at && new Date(selectedRequest.reviewed_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppRequests;
