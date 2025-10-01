"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider
                defaultTheme="system"
                storageKey="jiko-ui-theme"
            >
                {children}
            </ThemeProvider>
        </SessionProvider>
    );
}