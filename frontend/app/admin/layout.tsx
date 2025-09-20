'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [token, setToken] = useState<string | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
            window.location.href = '/';
            return;
        }
        setToken(adminToken);
    }, []);

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/';
    };

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { name: 'Users', href: '/admin/users', icon: '👥' },
        { name: 'OAuth Clients', href: '/admin/clients', icon: '🔗' },
    ];

    if (!token) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 shadow-lg">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="20" r="18" fill="white" opacity="0.2" />
                            <circle cx="20" cy="20" r="12" fill="white" />
                        </svg>
                        <h1 className="text-xl font-bold m-0">JIKO Admin</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Admin</span>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Выйти
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 min-h-[calc(100vh-80px)]">
                {/* Sidebar */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 p-8">
                    <nav>
                        <ul className="list-none p-0 m-0">
                            {navigation.map((item) => (
                                <li key={item.name} className="mb-2">
                                    <Link
                                        href={item.href}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors block ${pathname === item.href
                                                ? 'bg-blue-50 text-cyan-500 border-l-4 border-cyan-500 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {item.icon} {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 bg-white overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}