'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSignUp } from '@/hooks/use-sign-up';

export default function SignUp() {
	const { form, errors, isLoading, handleSubmit, updateForm } = useSignUp();

	return (
		<div className="h-full min-w-[512px] flex items-center justify-center">
			<div className="absolute top-4 right-4 flex gap-2">
				<Link href="/sign-in">
					<Button variant="outline" size="sm">
						Sign In
					</Button>
				</Link>
			</div>
			<Card className="w-full max-w-md">
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
								onChange={(e) => updateForm('username', e.target.value)}
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
								onChange={(e) => updateForm('email', e.target.value)}
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
								onChange={(e) => updateForm('password', e.target.value)}
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
								onChange={(e) => updateForm('confirmPassword', e.target.value)}
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
								onCheckedChange={(checked) => updateForm('terms', checked as boolean)}
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
		</div>
	);
}