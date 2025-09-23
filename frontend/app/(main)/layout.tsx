"use client";

import { Header } from "@/components/Header";
import Loading from "@/components/loading";
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { isAuthenticated, isLoading } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading && !isAuthenticated) {
            window.location.href = '/';
        }
    }, [mounted, isLoading, isAuthenticated]);

    if (!mounted || isLoading) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <Loading />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}