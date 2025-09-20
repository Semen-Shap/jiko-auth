'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AdminHeaderProps {
    onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
    return (
        <div className="h-16 p-4 border-b">
            <div className="flex justify-between items-center max-w-7xl mx-auto h-full">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-medium">Admin Panel</h1>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onLogout}
                        className="px-3 py-1.5 text-sm"
                    >
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
}
