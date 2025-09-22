'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Токен верификации отсутствует');
            return;
        }

        fetch(`/api/v1/auth/verify-email?token=${token}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setStatus('success');
                    setMessage('Email успешно подтвержден! Теперь вы можете войти в свой аккаунт.');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Ошибка при подтверждении email');
                }
            })
            .catch(error => {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage('Произошла ошибка при подтверждении email');
            });
    }, [searchParams]);

    const handleGoToLogin = () => {
        router.push('/sign-in');
    };

    return (
        <div className="h-full flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
                        {status === 'success' && <CheckCircle className="h-6 w-6 text-accent" />}
                        {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
                        Подтверждение Email
                    </CardTitle>
                    <CardDescription>
                        {status === 'loading' && 'Подтверждаем ваш email...'}
                        {status === 'success' && 'Email подтвержден'}
                        {status === 'error' && 'Ошибка подтверждения'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-6 text-gray-600 dark:text-primary">
                        {message}
                    </p>
                    {status !== 'loading' && (
                        <Button onClick={handleGoToLogin} className="w-full">
                            Перейти к входу
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}