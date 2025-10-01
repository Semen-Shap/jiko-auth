"use client";

import { Header } from "@/components/Header";
import Loading from "@/components/loading";
import { useSession } from 'next-auth/react';

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { status } = useSession();

	if (status === 'loading') return null;

	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				{children}
			</main>
		</div>
	);
}