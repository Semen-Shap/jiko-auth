import { useState } from 'react';
import { useNotification } from '@/components/NotificationProvider';

interface SignUpFormData {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
	terms: boolean;
}

interface SignUpErrors {
	[key: string]: string;
}

export function useSignUp() {
	const [form, setForm] = useState<SignUpFormData>({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
		terms: false
	});
	const [errors, setErrors] = useState<SignUpErrors>({});
	const [isLoading, setIsLoading] = useState(false);
	const { showNotification } = useNotification();

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const hasUpperCase = (str: string): boolean => /[A-Z]/.test(str);
	const hasLowerCase = (str: string): boolean => /[a-z]/.test(str);
	const hasNumber = (str: string): boolean => /\d/.test(str);
	const hasSpecialChar = (str: string): boolean => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(str);

	const validateForm = (): boolean => {
		const newErrors: SignUpErrors = {};

		if (!form.username) {
			newErrors.username = 'Username is required';
		} else if (form.username.length < 3) {
			newErrors.username = 'Username must be at least 3 characters';
		}

		if (!form.email) {
			newErrors.email = 'Email is required';
		} else if (!validateEmail(form.email)) {
			newErrors.email = 'Enter a valid email';
		}

		if (!form.password) {
			newErrors.password = 'Password is required';
		} else if (form.password.length < 8) {
			newErrors.password = 'Password must be at least 8 characters';
		} else if (!hasUpperCase(form.password) || !hasLowerCase(form.password) ||
			!hasNumber(form.password) || !hasSpecialChar(form.password)) {
			newErrors.password = 'Password must contain uppercase and lowercase letters, numbers, and special characters';
		}

		if (!form.confirmPassword) {
			newErrors.confirmPassword = 'Password confirmation is required';
		} else if (form.password !== form.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}

		if (!form.terms) {
			showNotification('You must accept the terms of use', 'error');
			return false;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsLoading(true);
		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: form.username,
					email: form.email,
					password: form.password
				})
			});

			const data = await response.json();

			if (response.ok) {
				showNotification(data.message || 'Registration successful!', 'success');
				setForm({
					username: '',
					email: '',
					password: '',
					confirmPassword: '',
					terms: false
				});
				setErrors({});
			} else {
				showNotification(data.error || 'An error occurred', 'error');
			}
		} catch (error) {
			console.error('Register error:', error);
			showNotification('An error occurred while submitting the form', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	const updateForm = (field: keyof SignUpFormData, value: string | boolean) => {
		setForm(prev => ({ ...prev, [field]: value }));
	};

	return {
		form,
		errors,
		isLoading,
		handleSubmit,
		updateForm
	};
}