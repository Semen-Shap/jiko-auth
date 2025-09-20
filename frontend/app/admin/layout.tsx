'use client';

import { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const adminToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');

        if (!adminToken || !storedUser) {
            window.location.href = '/';
            return;
        }

        try {
            const user = JSON.parse(storedUser);
            if (user.role !== 'admin') {
                window.location.href = '/';
                return;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            window.location.href = '/';
            return;
        }

        setToken(adminToken);
    }, []);

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('admin_token'); // Also remove old admin token if exists
        localStorage.removeItem('admin_user');
        window.location.href = '/';
    };

    if (!token) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <AdminHeader onLogout={logout} />

            <div className="flex min-h-[calc(100vh-64px)]">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Main Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}