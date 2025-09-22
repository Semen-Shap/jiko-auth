'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/components/Notification';
import Fallback from '@/components/fallback';

function SignInForm() {
    const [form, setForm] = useState({
        identifier: '',
        password: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { showNotification, NotificationComponent } = useNotification();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.identifier) {
            newErrors.identifier = 'Email or username is required';
        } else if (form.identifier.includes('@')) {
            if (!validateEmail(form.identifier)) {
                newErrors.identifier = 'Enter a valid email';
            }
        } else {
            if (form.identifier.length < 3) {
                newErrors.identifier = 'Username must be at least 3 characters';
            }
        }

        if (!form.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(data.message || 'Success!', 'success');

                // Save token and user data for all users
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect back to OAuth authorize page if redirect parameter exists
                setTimeout(() => {
                    if (redirectUrl) {
                        // Decode the redirect URL and navigate to it
                        window.location.href = decodeURIComponent(redirectUrl);
                    } else {
                        // Default redirect to home page
                        window.location.href = '/';
                    }
                }, 1000);
            } else {
                showNotification(data.error || 'An error occurred', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('An error occurred while submitting the form', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full min-w-[512px] flex items-center justify-center">
            <div className="absolute top-4 right-4 flex gap-2">
                <Link href="/sign-up">
                    <Button variant="outline" size="sm">
                        Sign Up
                    </Button>
                </Link>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">
                        JIKO
                    </CardTitle>
                    <CardDescription>
                        Sign in to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">
                                Email or Username
                            </Label>
                            <Input
                                id="identifier"
                                type="text"
                                value={form.identifier}
                                onChange={(e) => setForm(prev => ({ ...prev, identifier: e.target.value }))}
                                required
                            />
                            {errors.identifier && (
                                <div className="text-red-400 text-xs">{errors.identifier}</div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                                required
                            />
                            {errors.password && (
                                <div className="text-red-400 text-xs">{errors.password}</div>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {NotificationComponent}
        </div>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={<Fallback />}>
            <SignInForm />
        </Suspense>
    );
}