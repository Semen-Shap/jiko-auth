'use client';

import { useEffect } from 'react';
import { useStats } from '../../../lib/hooks/useAdmin';
import { useAdminAuth } from '../../../lib/hooks/useAdmin';

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
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('ru-RU')}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Всего пользователей</p>
                            <p className="text-2xl font-bold text-gray-800">{stats?.total_users || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            👥
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Подтвержденных</p>
                            <p className="text-2xl font-bold text-gray-800">{stats?.total_verified_users || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            ✅
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">OAuth клиентов</p>
                            <p className="text-2xl font-bold text-gray-800">{stats?.total_clients || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            🔗
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Новых сегодня</p>
                            <p className="text-2xl font-bold text-gray-800">{stats?.new_users_today || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            📈
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}