import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: number;
    color: string;
}

export default function StatCard({ icon: Icon, title, value, color }: StatCardProps) {
    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 min-h-[120px] flex flex-col justify-between shadow-lg">
            <div className="flex gap-5">
                <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center shadow-md transition-shadow duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{value}</p>
                </div>
            </div>
        </div>
    );
}