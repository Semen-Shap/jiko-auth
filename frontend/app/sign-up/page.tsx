'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotification } from '@/components/Notification';
import { ThemeToggle } from '@/components/ThemeToggle';

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

	return (
		<div className="min-h-screen flex items-center justify-center px-5">
			<div className="absolute top-4 right-4 flex gap-2">
				<ThemeToggle />
				<Link href="/sign-in">
					<Button variant="outline" size="sm">
						Sign In
					</Button>
				</Link>
			</div>			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">
						JIKO
					</CardTitle>
					<CardDescription>
						Create your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="username">
								Username
							</Label>
							<Input
								id="username"
								type="text"
								value={form.username}
								onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
								required
								minLength={3}
							/>
							{errors.username && (
								<div className="text-red-400 text-xs">{errors.username}</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">
								Email
							</Label>
							<Input
								id="email"
								type="email"
								value={form.email}
								onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
								required
							/>
							{errors.email && (
								<div className="text-red-400 text-xs">{errors.email}</div>
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
								minLength={8}
							/>
							<p className="text-xs">
								Must contain uppercase, lowercase letters, numbers, and special characters
							</p>
							{errors.password && (
								<div className="text-red-400 text-xs">{errors.password}</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">
								Confirm Password
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={form.confirmPassword}
								onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
							<Label htmlFor="terms" className="text-sm">
								I accept the terms of use
							</Label>
						</div>
						<Button
							type="submit"
							disabled={isLoading}
							className="w-full"
						>
							{isLoading ? 'Registering...' : 'Sign Up'}
						</Button>
					</form>
				</CardContent>
			</Card>

			{NotificationComponent}
		</div>
	);
}