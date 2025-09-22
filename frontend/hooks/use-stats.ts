import { useState, useCallback } from 'react';

export interface Stats {
    total_users: number;
    total_verified_users: number;
    total_clients: number;
    new_users_today: number;
}

export function useStats() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);

    const loadStats = useCallback(async (token: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const statsData = await response.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { stats, loading, loadStats };
}

