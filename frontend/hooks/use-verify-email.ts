import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function useVerifyEmail() {
	const searchParams = useSearchParams();
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

	return {
		status,
		message,
	};
}