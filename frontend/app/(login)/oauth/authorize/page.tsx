"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle, XCircle } from 'lucide-react';
import Fallback from '@/components/fallback';

interface ClientInfo {
    client_id: string;
    name: string;
    created_at: string;
}

function AuthorizePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // OAuth parameters - memoize to avoid recalculations
    const oauthParams = useMemo(() => ({
        clientId: searchParams.get('client_id'),
        redirectUri: searchParams.get('redirect_uri'),
        responseType: searchParams.get('response_type'),
        scope: searchParams.get('scope'),
        state: searchParams.get('state'),
    }), [searchParams]);

    // Validate parameters
    const isValidParams = useMemo(() =>
        oauthParams.clientId && oauthParams.redirectUri && oauthParams.responseType,
        [oauthParams]
    );

    // Fetch client info
    const fetchClientInfo = useCallback(async () => {
        if (!oauthParams.clientId) return;

        try {
            const response = await fetch(`/api/v1/oauth/client?client_id=${oauthParams.clientId}`);
            if (!response.ok) throw new Error('Failed to retrieve application information');
            const data = await response.json();
            setClientInfo(data);
        } catch (err) {
            throw err;
        }
    }, [oauthParams.clientId]);

    // Check if user has refresh token and auto-approve
    const checkAndAutoApprove = useCallback(async () => {
        if (!oauthParams.clientId || !token) return;

        try {
            const checkResponse = await fetch(`/api/v1/oauth/has_refresh_token?client_id=${oauthParams.clientId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                if (checkData.has_refresh_token) {
                    const approveResponse = await fetch('/api/v1/oauth/authorize', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            client_id: oauthParams.clientId,
                            redirect_uri: oauthParams.redirectUri,
                            response_type: oauthParams.responseType,
                            scope: oauthParams.scope || '',
                            state: oauthParams.state || '',
                            action: 'approve',
                        }),
                    });

                    if (approveResponse.ok) {
                        const approveData = await approveResponse.json();
                        if (approveData.redirect_url) {
                            window.location.href = approveData.redirect_url;
                            return true; // Indicate auto-approval happened
                        }
                    }
                }
            }
        } catch {
            // Ignore error, continue to show UI
        }
        return false;
    }, [oauthParams, token]);

    // Initialize data fetching
    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            const currentURL = window.location.href;
            router.push(`/sign-in?redirect=${encodeURIComponent(currentURL)}`);
            return;
        }

        if (!isValidParams) {
            setError('Invalid OAuth request parameters');
            setLoading(false);
            return;
        }

        const initialize = async () => {
            try {
                await fetchClientInfo();
                const autoApproved = await checkAndAutoApprove();
                if (!autoApproved) {
                    setLoading(false);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                setLoading(false);
            }
        };

        initialize();
    }, [authLoading, isAuthenticated, isValidParams, fetchClientInfo, checkAndAutoApprove, router]);

    // Handle authorization action
    const handleAuthorize = useCallback(async (action: 'approve' | 'deny') => {
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/oauth/authorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    client_id: oauthParams.clientId,
                    redirect_uri: oauthParams.redirectUri,
                    response_type: oauthParams.responseType,
                    scope: oauthParams.scope || '',
                    state: oauthParams.state || '',
                    action,
                }),
            });

            if (!response.ok) throw new Error('Error processing authorization request');

            const data = await response.json();
            if (data.redirect_url) {
                window.location.href = data.redirect_url;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    }, [oauthParams, token]);

    if (authLoading || loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading...</span>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                            Authorization Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="w-full"
                        >
                            Return to Home
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Access Request
                    </CardTitle>
                    <CardDescription>
                        The application is requesting access to your account
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">
                            {clientInfo?.name}
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Wants to access your profile
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Requested permissions:</p>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Access to basic profile information</span>
                        </div>
                        {oauthParams.scope && oauthParams.scope !== 'read' && (
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Additional permissions: {oauthParams.scope}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Logged in as: <span className="font-medium">{user?.username}</span></p>
                    </div>
                </CardContent>

                <CardFooter className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => handleAuthorize('deny')}
                        disabled={submitting}
                        className="flex-1"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Deny
                    </Button>
                    <Button
                        onClick={() => handleAuthorize('approve')}
                        disabled={submitting}
                        className="flex-1"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Allow Access
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function AuthorizePage() {
    return (
        <Suspense fallback={<Fallback />}>
            <AuthorizePageContent />
        </Suspense>
    );
}