"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
	const { data: session } = useSession();
	const user = session?.user;
	const isAdmin = user?.role === 'admin';

	const logout = async () => {
		await signOut({ callbackUrl: "/" });
	};

	return (
		<div className="min-h-[calc(100vh-50px)] flex items-center justify-center px-5">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">
						Welcome back, {user?.name}!
					</CardTitle>
					<CardDescription>
						You are successfully logged in to JIKO
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<p className="mb-6">
						Welcome to the JIKO ecosystem. You can now access all features.
					</p>
					<div className="space-y-3">
						{isAdmin && (
							<Link href="/admin" className="block">
								<Button className="w-full">
									Go to Admin Panel
								</Button>
							</Link>
						)}
						<Button variant="outline" className="w-full" onClick={logout}>
							Logout
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}