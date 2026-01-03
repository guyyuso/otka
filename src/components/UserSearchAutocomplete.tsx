import React, { useState, useEffect, useRef } from 'react';
import { Search, User as UserIcon, X } from 'lucide-react';
import { usersApi } from '../lib/api';

interface UserOption {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface UserSearchAutocompleteProps {
    onSelect: (user: UserOption) => void;
    placeholder?: string;
    selectedUser?: UserOption | null;
    onClear?: () => void;
}

const UserSearchAutocomplete: React.FC<UserSearchAutocompleteProps> = ({
    onSelect,
    placeholder = 'Search users...',
    selectedUser,
    onClear
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserOption[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
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
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const users = await usersApi.search(query, 10);
                setResults(users);
                setIsOpen(true);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
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
        onSelect(user);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    if (selectedUser) {
        return (
            <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 text-sm">{selectedUser.name}</p>
                        <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                </div>
                {onClear && (
                    <button
                        onClick={onClear}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => handleSelect(user)}
                            className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <UserIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${user.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-100 text-gray-600'
                                }`}>
                                {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 1 && results.length === 0 && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                    No users found matching "{query}"
                </div>
            )}
        </div>
    );
};

export default UserSearchAutocomplete;
