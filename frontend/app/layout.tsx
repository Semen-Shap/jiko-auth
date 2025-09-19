import "../globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "Jiko Bridge",
  description: "Jiko Bridge App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
