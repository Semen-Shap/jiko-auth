'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';

interface NotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

export function Notification({ message, type, onClose }: NotificationProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <Alert variant={type === 'error' ? 'destructive' : 'default'} className="relative">
                <AlertDescription className="flex items-center justify-between">
                    <span>{message}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="ml-4 h-auto p-0 hover:bg-transparent"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
}

export function useNotification() {
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
        setNotification({ message, type });
    };

    const hideNotification = () => {
        setNotification(null);
    };

    return {
        notification,
        showNotification,
        hideNotification,
        NotificationComponent: notification ? (
            <Notification
                message={notification.message}
                type={notification.type}
                onClose={hideNotification}
            />
        ) : null
    };
}