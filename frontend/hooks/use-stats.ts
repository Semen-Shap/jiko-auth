import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface Stats {
	total_users: number;
	total_verified_users: number;
	total_clients: number;
	new_users_today: number;
}

export function useStats() {
	const { data: session } = useSession();
	const token = (session as any)?.accessToken;
	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(false);

	const loadStats = useCallback(async () => {
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
	}, [token]);

	useEffect(() => {
		loadStats();
	}, [loadStats]);

	return { stats, loading, loadStats };
}

