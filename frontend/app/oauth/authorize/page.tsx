"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle, XCircle } from 'lucide-react';

interface ClientInfo {
    client_id: string;
    name: string;
    created_at: string;
}

export default function AuthorizePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // OAuth parameters
    const clientId = searchParams.get('client_id');
    const redirectUri = searchParams.get('redirect_uri');
    const responseType = searchParams.get('response_type');
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');

    useEffect(() => {
        if (authLoading) return;

        // Redirect to login if not authenticated
        if (!isAuthenticated) {
            const currentURL = window.location.href;
            router.push(`/sign-in?redirect=${encodeURIComponent(currentURL)}`);
            return;
        }

        // Validate required parameters
        if (!clientId || !redirectUri || !responseType) {
            setError('Неверные параметры OAuth запроса');
            setLoading(false);
            return;
        }

        // Fetch client information
        fetchClientInfo();
    }, [authLoading, isAuthenticated, clientId, redirectUri, responseType]);

    const fetchClientInfo = async () => {
        try {
            const response = await fetch(`/api/v1/oauth/client?client_id=${clientId}`);

            if (!response.ok) {
                throw new Error('Не удалось получить информацию о приложении');
            }

            const data = await response.json();
            setClientInfo(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorize = async (action: 'approve' | 'deny') => {
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
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    response_type: responseType,
                    scope: scope || '',
                    state: state || '',
                    action: action,
                }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при обработке запроса авторизации');
            }

            const data = await response.json();

            // Redirect to the client application
            if (data.redirect_url) {
                window.location.href = data.redirect_url;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Загрузка...</span>
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
                            Ошибка авторизации
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
                            Вернуться на главную
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
                        Запрос доступа
                    </CardTitle>
                    <CardDescription>
                        Приложение запрашивает доступ к вашему аккаунту
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">
                            {clientInfo?.name}
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Хочет получить доступ к вашему профилю
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Запрашиваемые разрешения:</p>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Доступ к основной информации профиля</span>
                        </div>
                        {scope && scope !== 'read' && (
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Дополнительные разрешения: {scope}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Войдя как: <span className="font-medium">{user?.username}</span></p>
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
                        Отказать
                    </Button>
                    <Button
                        onClick={() => handleAuthorize('approve')}
                        disabled={submitting}
                        className="flex-1"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Разрешить доступ
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}