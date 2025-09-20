'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminHeader from '../../components/AdminHeader';
import { BarChart3, Users, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
        { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'OAuth Clients', href: '/admin/clients', icon: LinkIcon },
    ];

    if (!token) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <AdminHeader onLogout={logout} />

            <div className="flex min-h-[calc(100vh-64px)]">
                {/* Sidebar */}
                <Card className="w-64 bg-gray-800 border-r border-gray-700 rounded-none">
                    <CardContent className="p-6">
                        <nav>
                            <ul className="space-y-2">
                                {navigation.map((item) => (
                                    <li key={item.name}>
                                        <Button
                                            asChild
                                            variant={pathname === item.href ? "default" : "ghost"}
                                            className={`w-full justify-start gap-3 ${pathname === item.href
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                }`}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="w-4 h-4" />
                                                <span className="text-sm">{item.name}</span>
                                            </Link>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="flex-1 p-6 bg-gray-900 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}