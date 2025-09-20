'use client';

import { Shield } from 'lucide-react';

interface AdminHeaderProps {
    onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
    return (
        <div className="bg-gray-900 text-white p-4 border-b border-gray-800">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <h1 className="text-lg font-medium">JIKO Admin</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">Admin</span>
                    <button
                        onClick={onLogout}
                        className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                        Выйти
                    </button>
                </div>
            </div>
        </div>
    );
}
