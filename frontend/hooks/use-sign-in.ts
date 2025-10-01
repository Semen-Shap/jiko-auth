import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/NotificationProvider';

export function useSignIn() {
	const [form, setForm] = useState({
		identifier: '',
		password: ''
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(false);
	const { showNotification } = useNotification();
	const searchParams = useSearchParams();
	const router = useRouter();
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
			const result = await signIn('credentials', {
				identifier: form.identifier,
				password: form.password,
				redirect: false,
			});

			if (result?.error) {
				showNotification('Invalid credentials', 'error');
			} else if (result?.ok) {
				showNotification('Login successful!', 'success');
				setTimeout(() => {
					if (redirectUrl) {
						router.push(decodeURIComponent(redirectUrl));
					} else {
						router.push('/');
					}
				}, 1000);
			}
		} catch (error) {
			console.error('Login error:', error);
			showNotification('An error occurred while signing in', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	const updateForm = (field: string, value: string) => {
		setForm(prev => ({ ...prev, [field]: value }));
	};

	return {
		form,
		errors,
		isLoading,
		updateForm,
		handleSubmit,
	};
}