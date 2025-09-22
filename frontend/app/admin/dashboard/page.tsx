'use client';

import { useEffect } from 'react';
import { useStats } from '@/hooks/use-stats';
import { useAuth } from '@/hooks/use-auth';
import { Users, CheckCircle, Link, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';

export default function Dashboard() {
    const { token } = useAuth();
    const { stats, loading, loadStats } = useStats();

    useEffect(() => {
        if (token) {
            loadStats(token);
        }
    }, [token, loadStats]);

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-medium">Dashboard</h2>
                <div className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-US')}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Users}
                    title="All users"
                    value={stats?.total_users || 0}
                />
                <StatCard
                    icon={CheckCircle}
                    title="Verified users"
                    value={stats?.total_verified_users || 0}
                />
                <StatCard
                    icon={Link}
                    title="OAuth clients"
                    value={stats?.total_clients || 0}
                />
                <StatCard
                    icon={TrendingUp}
                    title="New users today"
                    value={stats?.new_users_today || 0}
                />
            </div>
        </div>
    );
}