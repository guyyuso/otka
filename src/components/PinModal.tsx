import React, { useState, useRef, useEffect } from 'react';
import { Lock, X, AlertCircle, Loader } from 'lucide-react';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (pin: string) => Promise<{ verified: boolean; error?: string; remainingAttempts?: number }>;
    appName: string;
}

const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onVerify, appName }) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ];

    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', '']);
            setError('');
            setTimeout(() => inputRefs[0].current?.focus(), 100);
        }
    }, [isOpen]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);
        setError('');

        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleSubmit = async () => {
        const fullPin = pin.join('');
        if (fullPin.length !== 4) {
            setError('Please enter all 4 digits');
            return;
        }

        setLoading(true);
        try {
            const result = await onVerify(fullPin);
            if (!result.verified) {
                setError(result.error || 'Incorrect PIN');
                setPin(['', '', '', '']);
                inputRefs[0].current?.focus();
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <Lock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Enter PIN</h2>
                                <p className="text-sm text-gray-500">{appName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex justify-center gap-3 my-6">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={inputRefs[index]}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="flex items-center justify-center text-red-600 text-sm mb-4">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || pin.some(d => !d)}
                            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                'Verify'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PinModal;
