import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, FileText, Search, Filter, X } from 'lucide-react';
import { requestsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface AppRequest {
    id: string;
    app_identifier_or_name: string;
    app_id?: string;
    app_name?: string;
    app_exists_in_store: boolean;
    reason: string;
    status: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'implemented' | 'cancelled';
    cost_center?: string;
    priority?: string;
    desired_by_date?: string;
    notes?: string;
    created_at: string;
    reviewed_at?: string;
    reviewed_by_name?: string;
    deny_reason?: string;
    requester_name?: string;
    requester_email?: string;
    history?: Array<{
        id: string;
        status: string;
        changed_by_name?: string;
        note?: string;
        created_at: string;
    }>;
}

const SettingsRequests: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<AppRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<AppRequest | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await requestsApi.getAll(statusFilter || undefined);
            console.log('Fetched requests:', data); // Debug log
            setRequests(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Error fetching requests:', error);
            // Show user-friendly error
            if (error?.message) {
                alert(`Error loading requests: ${error.message}`);
            }
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: AppRequest['status']) => {
        const statusConfig = {
            submitted: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Submitted' },
            'in_review': { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'In Review' },
            approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' },
            rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
            implemented: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Implemented' },
            cancelled: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Cancelled' },
        };

        const config = statusConfig[status] || statusConfig.submitted;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        );
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = !searchTerm || 
            req.app_identifier_or_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.app_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.requester_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const statusCounts = {
        submitted: requests.filter(r => r.status === 'submitted').length,
        'in_review': requests.filter(r => r.status === 'in_review').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        implemented: requests.filter(r => r.status === 'implemented').length,
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">App Requests</h2>
                    <p className="text-gray-600 mt-1">
                        {isAdmin 
                            ? 'Manage all app requests from users' 
                            : 'Track your app requests and their status'}
                    </p>
                </div>
                {!isAdmin && (
                    <button
                        onClick={() => window.location.href = '/store'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        Request New App
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setStatusFilter('')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            !statusFilter
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        All ({requests.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('submitted')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            statusFilter === 'submitted'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        Submitted ({statusCounts.submitted})
                    </button>
                    <button
                        onClick={() => setStatusFilter('in_review')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            statusFilter === 'in_review'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        In Review ({statusCounts['in_review']})
                    </button>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {filteredRequests.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">No requests found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredRequests.map(request => (
                            <div
                                key={request.id}
                                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => setSelectedRequest(request)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {request.app_name || request.app_identifier_or_name}
                                            </h3>
                                            {getStatusBadge(request.status)}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                            {request.reason}
                                        </p>
                                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                            <span>
                                                {isAdmin && request.requester_name
                                                    ? `Requested by ${request.requester_name}`
                                                    : 'You requested'}
                                            </span>
                                            <span>
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </span>
                                            {request.priority && (
                                                <span className="capitalize">Priority: {request.priority}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Detail Modal */}
            {selectedRequest && (
                <RequestDetailModal
                    request={selectedRequest}
                    isAdmin={isAdmin}
                    onClose={() => setSelectedRequest(null)}
                    onRefresh={fetchRequests}
                />
            )}
        </div>
    );
};

interface RequestDetailModalProps {
    request: AppRequest;
    isAdmin: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, isAdmin, onClose, onRefresh }) => {
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [fullRequest, setFullRequest] = useState<AppRequest>(request);

    useEffect(() => {
        if (request.id && !request.history) {
            fetchDetails();
        }
    }, [request.id]);

    const fetchDetails = async () => {
        try {
            setLoadingDetails(true);
            const data = await requestsApi.get(request.id);
            setFullRequest(data);
        } catch (error) {
            console.error('Error fetching request details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getStatusBadge = (status: AppRequest['status']) => {
        const statusConfig = {
            submitted: { color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
            'in_review': { color: 'bg-yellow-100 text-yellow-700', label: 'In Review' },
            approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
            rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
            implemented: { color: 'bg-green-100 text-green-700', label: 'Implemented' },
            cancelled: { color: 'bg-gray-100 text-gray-700', label: 'Cancelled' },
        };
        const config = statusConfig[status] || statusConfig.submitted;
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {loadingDetails ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Request Info */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {fullRequest.app_name || fullRequest.app_identifier_or_name}
                                    </h3>
                                    {getStatusBadge(fullRequest.status)}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Requested by:</span>{' '}
                                        <span className="text-gray-600">
                                            {isAdmin && fullRequest.requester_name
                                                ? `${fullRequest.requester_name} (${fullRequest.requester_email})`
                                                : 'You'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Submitted:</span>{' '}
                                        <span className="text-gray-600">
                                            {new Date(fullRequest.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {fullRequest.reviewed_at && (
                                        <div>
                                            <span className="font-medium text-gray-700">Reviewed:</span>{' '}
                                            <span className="text-gray-600">
                                                {new Date(fullRequest.reviewed_at).toLocaleString()}
                                                {fullRequest.reviewed_by_name && ` by ${fullRequest.reviewed_by_name}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Business Justification */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Business Justification</h4>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                                    {fullRequest.reason}
                                </p>
                            </div>

                            {/* Additional Info */}
                            {(fullRequest.cost_center || fullRequest.priority || fullRequest.desired_by_date || fullRequest.notes) && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                                    <div className="space-y-2 text-sm">
                                        {fullRequest.cost_center && (
                                            <div>
                                                <span className="font-medium text-gray-700">Cost Center:</span>{' '}
                                                <span className="text-gray-600">{fullRequest.cost_center}</span>
                                            </div>
                                        )}
                                        {fullRequest.priority && (
                                            <div>
                                                <span className="font-medium text-gray-700">Priority:</span>{' '}
                                                <span className="text-gray-600 capitalize">{fullRequest.priority}</span>
                                            </div>
                                        )}
                                        {fullRequest.desired_by_date && (
                                            <div>
                                                <span className="font-medium text-gray-700">Desired By:</span>{' '}
                                                <span className="text-gray-600">
                                                    {new Date(fullRequest.desired_by_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        {fullRequest.notes && (
                                            <div>
                                                <span className="font-medium text-gray-700">Notes:</span>
                                                <p className="text-gray-600 mt-1">{fullRequest.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {fullRequest.status === 'rejected' && fullRequest.deny_reason && (
                                <div>
                                    <h4 className="font-medium text-red-900 mb-2">Rejection Reason</h4>
                                    <p className="text-sm text-red-700 bg-red-50 p-4 rounded-lg">
                                        {fullRequest.deny_reason}
                                    </p>
                                </div>
                            )}

                            {/* History */}
                            {fullRequest.history && fullRequest.history.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Request History</h4>
                                    <div className="space-y-3">
                                        {fullRequest.history.map((event, idx) => (
                                            <div key={event.id || idx} className="flex gap-3 text-sm">
                                                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-gray-900 capitalize">
                                                            {event.status.replace('_', ' ')}
                                                        </span>
                                                        {event.changed_by_name && (
                                                            <span className="text-gray-500">
                                                                by {event.changed_by_name}
                                                            </span>
                                                        )}
                                                        <span className="text-gray-400">
                                                            {new Date(event.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {event.note && (
                                                        <p className="text-gray-600">{event.note}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsRequests;

