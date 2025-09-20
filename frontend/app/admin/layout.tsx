'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { Header } from '@/components/Header';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

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

    if (!token) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen flex">
            <SidebarProvider>
                <AdminSidebar />
                <div className="flex-1 flex flex-col">
                    <Header />
                    <SidebarInset className="flex-1">
                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator orientation="vertical" className="mr-2 h-4" />
                                <h1 className="text-lg font-semibold">Admin Dashboard</h1>
                            </div>
                        </header>
                        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                            {children}
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
}