'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignIn } from '@/hooks/use-sign-in';

export default function SignIn() {
	const { form, errors, isLoading, updateForm, handleSubmit } = useSignIn();

	return (
		<div className="h-full min-w-[512px] flex items-center justify-center">
			<div className="absolute top-4 right-4 flex gap-2">
				<Link href="/sign-up">
					<Button variant="outline" size="sm">
						Sign Up
					</Button>
				</Link>
			</div>

			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">
						JIKO
					</CardTitle>
					<CardDescription>
						Sign in to your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="identifier">
								Email or Username
							</Label>
							<Input
								id="identifier"
								type="text"
								value={form.identifier}
								onChange={(e) => updateForm('identifier', e.target.value)}
								required
							/>
							{errors.identifier && (
								<div className="text-red-400 text-xs">{errors.identifier}</div>
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
							/>
							{errors.password && (
								<div className="text-red-400 text-xs">{errors.password}</div>
							)}
						</div>
						<Button
							type="submit"
							disabled={isLoading}
							className="w-full"
						>
							{isLoading ? 'Signing in...' : 'Sign In'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}