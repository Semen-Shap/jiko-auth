'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotification } from '@/components/Notification';

export default function SignUp() {
	const [form, setForm] = useState({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
		terms: false
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(false);
	const { showNotification, NotificationComponent } = useNotification();

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const hasUpperCase = (str: string): boolean => /[A-Z]/.test(str);
	const hasLowerCase = (str: string): boolean => /[a-z]/.test(str);
	const hasNumber = (str: string): boolean => /\d/.test(str);
	const hasSpecialChar = (str: string): boolean => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(str);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!form.username) {
			newErrors.username = 'Имя пользователя обязательно';
		} else if (form.username.length < 3) {
			newErrors.username = 'Имя пользователя должно содержать не менее 3 символов';
		}

		if (!form.email) {
			newErrors.email = 'Email обязателен';
		} else if (!validateEmail(form.email)) {
			newErrors.email = 'Введите корректный email';
		}

		if (!form.password) {
			newErrors.password = 'Пароль обязателен';
		} else if (form.password.length < 8) {
			newErrors.password = 'Пароль должен содержать не менее 8 символов';
		} else if (!hasUpperCase(form.password) || !hasLowerCase(form.password) ||
			!hasNumber(form.password) || !hasSpecialChar(form.password)) {
			newErrors.password = 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы';
		}

		if (!form.confirmPassword) {
			newErrors.confirmPassword = 'Подтверждение пароля обязательно';
		} else if (form.password !== form.confirmPassword) {
			newErrors.confirmPassword = 'Пароли не совпадают';
		}

		if (!form.terms) {
			showNotification('Необходимо принять условия использования', 'error');
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
			const response = await fetch('/api/v1/auth/register', {
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
				showNotification(data.message || 'Регистрация успешна!', 'success');
				setForm({
					username: '',
					email: '',
					password: '',
					confirmPassword: '',
					terms: false
				});
				setErrors({});
			} else {
				showNotification(data.error || 'Произошла ошибка', 'error');
			}
		} catch (error) {
			console.error('Register error:', error);
			showNotification('Произошла ошибка при отправке формы', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center px-5">
			<div className="absolute top-4 right-4">
				<Link href="/sign-in">
					<Button variant="outline" size="sm">
						Sign In
					</Button>
				</Link>
			</div>

			<Card className="w-full max-w-md bg-gray-800 border-gray-700">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
						JIKO
					</CardTitle>
					<CardDescription className="text-gray-400">
						Create your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="username" className="text-white">
								Username
							</Label>
							<Input
								id="username"
								type="text"
								value={form.username}
								onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
								className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
								required
								minLength={3}
							/>
							{errors.username && (
								<div className="text-red-400 text-xs">{errors.username}</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email" className="text-white">
								Email
							</Label>
							<Input
								id="email"
								type="email"
								value={form.email}
								onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
								className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
								required
							/>
							{errors.email && (
								<div className="text-red-400 text-xs">{errors.email}</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="password" className="text-white">
								Password
							</Label>
							<Input
								id="password"
								type="password"
								value={form.password}
								onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
								className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
								required
								minLength={8}
							/>
							<p className="text-gray-400 text-xs">
								Must contain uppercase, lowercase letters, numbers, and special characters
							</p>
							{errors.password && (
								<div className="text-red-400 text-xs">{errors.password}</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword" className="text-white">
								Confirm Password
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={form.confirmPassword}
								onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
								className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
								required
							/>
							{errors.confirmPassword && (
								<div className="text-red-400 text-xs">{errors.confirmPassword}</div>
							)}
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox
								id="terms"
								checked={form.terms}
								onCheckedChange={(checked) => setForm(prev => ({ ...prev, terms: checked as boolean }))}
								required
							/>
							<Label htmlFor="terms" className="text-sm text-gray-400">
								I accept the terms of use
							</Label>
						</div>
						<Button
							type="submit"
							disabled={isLoading}
							className="w-full bg-cyan-500 text-black hover:bg-cyan-400"
						>
							{isLoading ? 'Регистрация...' : 'Sign Up'}
						</Button>
					</form>
				</CardContent>
			</Card>

			{NotificationComponent}
		</div>
	);
}