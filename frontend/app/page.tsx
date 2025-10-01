"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

export default function Welcome() {
	const { status } = useSession();

	if (status === 'loading') return null;

	return (
		<main className="min-h-screen flex flex-col items-center justify-center">
			<div className="h-full min-w-[512px] flex items-center justify-center">
				<div className="absolute top-4 right-4 flex gap-2">
					<Link href="/sign-in">
						<Button variant="outline" size="sm">
							Sign In
						</Button>
					</Link>
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
							Welcome to JIKO Authentication System
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="mb-6">
							Choose an option to get started
						</p>
						<div className="space-y-3">
							<Link href="/sign-in" className="block">
								<Button className="w-full">
									Sign In
								</Button>
							</Link>
							<Link href="/sign-up" className="block">
								<Button variant="outline" className="w-full">
									Sign Up
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}