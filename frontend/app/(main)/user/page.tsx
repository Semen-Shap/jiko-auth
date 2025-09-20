"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ArrowLeft, User, Mail, Calendar, Shield } from 'lucide-react';

export default function UserProfile() {
    const { user, isAuthenticated, isLoading, logout, isAdmin } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading && !isAuthenticated) {
            window.location.href = '/sign-in';
        }
    }, [mounted, isLoading, isAuthenticated]);

    if (!mounted || isLoading) {
        return (
            <div className="min-h-[calc(100vh-50px)] flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="w-full">
            {/* Profile Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="mb-4">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold">User Profile</h1>
                    </div>
                    {/* Profile Header */}
                    <Card className="mb-6">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src="" alt={user.username} />
                                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                        {user.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle className="text-3xl font-bold">{user.username}</CardTitle>
                            <CardDescription className="text-lg">
                                {isAdmin && <Badge variant="secondary" className="mr-2">Administrator</Badge>}
                                Member since {new Date().getFullYear()}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Profile Details */}
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Account Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Username</p>
                                        <p className="font-medium">{user.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{user.email || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Member since</p>
                                        <p className="font-medium">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Role</p>
                                            <Badge>Administrator</Badge>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full">
                                    Edit Profile
                                </Button>
                                <Button variant="outline" className="w-full">
                                    Change Password
                                </Button>
                                <Button variant="destructive" className="w-full">
                                    Delete Account
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}