"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationProvider } from "@/components/NotificationProvider";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<ThemeProvider
				defaultTheme="system"
				storageKey="jiko-ui-theme"
			>
				<NotificationProvider>
					{children}
				</NotificationProvider>
			</ThemeProvider>
		</SessionProvider>
	);
}