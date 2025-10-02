'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { useVerifyEmail } from '@/hooks/use-verify-email';

function VerifyEmailContent() {
	const router = useRouter();
	const { status, message } = useVerifyEmail();

	if (status === 'loading') return null;

	return (
		<div className="h-full flex items-center justify-center">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="flex items-center justify-center gap-2">
						{status === 'success' && <CheckCircle className="h-6 w-6 text-accent" />}
						{status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
						Подтверждение Email
					</CardTitle>
					<CardDescription>
						{status === 'success' && 'Email подтвержден'}
						{status === 'error' && 'Ошибка подтверждения'}
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<p className="mb-6 text-gray-600 dark:text-primary">
						{message}
					</p>
					<Button onClick={() => router.push('/sign-in')} className="w-full">
						Перейти к входу
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={null}>
			<VerifyEmailContent />
		</Suspense>
	);
}