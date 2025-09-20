import { Header } from "@/components/Header";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Header />
            <main className="min-h-screen flex-1 flex flex-col items-center justify-center">
                {children}
            </main>
        </>
    );
}