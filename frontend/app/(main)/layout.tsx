"use client";

import { Header } from "@/components/Header";
import Loading from "@/components/loading";
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { data: session, status } = useSession();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted && status !== 'loading' && !session) {
			window.location.href = '/';
		}
	}, [mounted, status, session]);

	if (!mounted || status === 'loading') {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<Loading />
			</div>
		);
	}

	if (!session) {
		return null; // Will redirect in useEffect
	}

	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				{children}
			</main>
		</div>
	);
}