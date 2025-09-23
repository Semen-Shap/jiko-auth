'use client';

import { useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import Loading from '@/components/loading';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { isAuthenticated, isLoading, isAdmin } = useAuth();

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !isAdmin)) {
            window.location.href = '/access-denied';
        }
    }, [isAuthenticated, isLoading, isAdmin]);

    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <Loading />
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen flex">
            <SidebarProvider>
                <AdminSidebar />
                <SidebarInset className="flex-1">
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <h1 className="text-lg font-semibold">Admin Panel</h1>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}