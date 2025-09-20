'use client';

import { useEffect } from 'react';
import { useStats } from '../../../lib/hooks/useAdmin';
import { useAdminAuth } from '../../../lib/hooks/useAdmin';
import { Users, CheckCircle, Link, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';

export default function Dashboard() {
    const { token } = useAdminAuth();
    const { stats, loading, loadStats } = useStats();

    useEffect(() => {
        if (token) {
            loadStats(token);
        }
    }, [token, loadStats]);

    if (loading) {
        return <div className="text-center py-8">Загрузка...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-medium text-white">Dashboard</h2>
                <div className="text-sm text-gray-400">
                    {new Date().toLocaleDateString('ru-RU')}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Users}
                    title="All users"
                    value={stats?.total_users || 0}
                    color="bg-blue-600"
                />
                <StatCard
                    icon={CheckCircle}
                    title="Verified users"
                    value={stats?.total_verified_users || 0}
                    color="bg-green-600"
                />
                <StatCard
                    icon={Link}
                    title="OAuth clients"
                    value={stats?.total_clients || 0}
                    color="bg-purple-600"
                />
                <StatCard
                    icon={TrendingUp}
                    title="New users today"
                    value={stats?.new_users_today || 0}
                    color="bg-orange-600"
                />
            </div>
        </div>
    );
}