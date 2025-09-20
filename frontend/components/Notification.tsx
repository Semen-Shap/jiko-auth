'use client';

import { useState, useEffect } from 'react';

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
        <div
            className={`fixed top-5 right-5 p-4 rounded-lg text-white shadow-lg transform transition-all duration-300 z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}
        >
            <span>{message}</span>
            <button
                onClick={onClose}
                className="ml-4 text-white hover:text-gray-200"
            >
                ×
            </button>
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