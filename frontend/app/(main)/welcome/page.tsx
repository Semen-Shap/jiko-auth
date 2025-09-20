"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function Home() {
    const { user, isAuthenticated, isLoading, logout, isAdmin } = useAuth();
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
            <div className="min-h-[calc(100vh-50px)] flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-[calc(100vh-50px)] flex items-center justify-center px-5">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">
                        Welcome back, {user?.username}!
                    </CardTitle>
                    <CardDescription>
                        You are successfully logged in to JIKO
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-6">
                        Welcome to the JIKO ecosystem. You can now access all features.
                    </p>
                    <div className="space-y-3">
                        {isAdmin && (
                            <Link href="/admin" className="block">
                                <Button className="w-full">
                                    Go to Admin Panel
                                </Button>
                            </Link>
                        )}
                        <Button variant="outline" className="w-full" onClick={logout}>
                            Logout
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}