import React, { useState, useEffect } from 'react';
import { Search, Tag, Download, CheckCircle, Clock, XCircle, ExternalLink, Globe } from 'lucide-react';
import Header from '../components/Header';
import { storeApi } from '../lib/api';

interface StoreApp {
    id: string;
    name: string;
    short_description: string;
    description: string;
    category: string;
    tags: string[];
    publisher: string;
    logo_url: string;
    icon_url: string;
    launch_url: string;
    requires_approval: boolean;
    user_status: 'AVAILABLE' | 'ASSIGNED' | 'PENDING' | 'APPROVED' | 'DENIED';
}

const Store: React.FC = () => {
    const [apps, setApps] = useState<StoreApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [requestModalApp, setRequestModalApp] = useState<StoreApp | null>(null);
    const [requestReason, setRequestReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            setLoading(true);
            const data = await storeApi.getApps();
            setApps(data);
        } catch (error) {
            console.error('Error fetching store apps:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(apps.map(app => app.category).filter(Boolean))];

    const filteredApps = apps.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (app.short_description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || app.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestModalApp || !requestReason.trim()) return;

        setSubmitting(true);
        try {
            const result = await storeApi.requestApp(requestModalApp.id, requestReason.trim());

            // Update the app's status in the list
            setApps(prev => prev.map(app =>
                app.id === requestModalApp.id
                    ? { ...app, user_status: result.status }
                    : app
            ));

            setRequestModalApp(null);
            setRequestReason('');

            if (result.auto_approved) {
                alert('App has been added to your dashboard!');
            } else {
                alert('Request submitted! An admin will review it soon.');
            }
        } catch (error: any) {
            alert(error.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: StoreApp['user_status']) => {
        switch (status) {
            case 'ASSIGNED':
            case 'APPROVED':
                return (
                    <span className="flex items-center text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="w-3 h-3 mr-1" /> Installed
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="flex items-center text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                    </span>
                );
            case 'DENIED':
                return (
                    <span className="flex items-center text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        <XCircle className="w-3 h-3 mr-1" /> Denied
                    </span>
                );
            default:
                return null;
        }
    };

    const getActionButton = (app: StoreApp) => {
        switch (app.user_status) {
            case 'ASSIGNED':
            case 'APPROVED':
                return (
                    <a
                        href={app.launch_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" /> Launch
                    </a>
                );
            case 'PENDING':
                return (
                    <button disabled className="flex items-center px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                        <Clock className="w-4 h-4 mr-2" /> Pending Review
                    </button>
                );
            case 'DENIED':
                return (
                    <button
                        onClick={() => setRequestModalApp(app)}
                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" /> Request Again
                    </button>
                );
            default:
                return (
                    <button
                        onClick={() => setRequestModalApp(app)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {app.requires_approval ? 'Request' : 'Get'}
                    </button>
                );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white">
                    <h1 className="text-3xl font-bold mb-2">App Store</h1>
                    <p className="text-blue-100 mb-6">Discover and request applications for your work</p>

                    {/* Search */}
                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search apps..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-300"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Apps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredApps.map(app => (
                        <div key={app.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center">
                                        {app.logo_url || app.icon_url ? (
                                            <img
                                                src={app.icon_url || app.logo_url}
                                                alt={app.name}
                                                className="w-14 h-14 rounded-xl object-contain bg-gray-50 p-2"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                                                <Globe className="w-7 h-7" />
                                            </div>
                                        )}
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                                            {app.publisher && (
                                                <p className="text-sm text-gray-500">{app.publisher}</p>
                                            )}
                                        </div>
                                    </div>
                                    {getStatusBadge(app.user_status)}
                                </div>

                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {app.short_description || app.description || 'No description available'}
                                </p>

                                {app.tags && app.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {app.tags.slice(0, 3).map((tag, idx) => (
                                            <span key={idx} className="inline-flex items-center text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                <Tag className="w-3 h-3 mr-1" />{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                        {app.category || 'General'}
                                    </span>
                                    {getActionButton(app)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredApps.length === 0 && (
                        <div className="col-span-full py-16 text-center text-gray-500">
                            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg">No apps found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Request Modal */}
            {requestModalApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Request App Access</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {requestModalApp.requires_approval
                                    ? 'An admin will review your request'
                                    : 'This app will be added to your dashboard immediately'}
                            </p>
                        </div>

                        <form onSubmit={handleRequest} className="p-6">
                            <div className="flex items-center mb-4">
                                {requestModalApp.icon_url || requestModalApp.logo_url ? (
                                    <img
                                        src={requestModalApp.icon_url || requestModalApp.logo_url}
                                        alt=""
                                        className="w-12 h-12 rounded-lg object-contain bg-gray-50"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                )}
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-900">{requestModalApp.name}</p>
                                    <p className="text-sm text-gray-500">{requestModalApp.category}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Why do you need this app? <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-24"
                                    placeholder="Explain your business need for this application..."
                                    value={requestReason}
                                    onChange={e => setRequestReason(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRequestModalApp(null);
                                        setRequestReason('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !requestReason.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store;
