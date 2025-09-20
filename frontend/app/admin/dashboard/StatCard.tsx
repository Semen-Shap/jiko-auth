import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: number;
}

export default function StatCard({ icon: Icon, title, value }: StatCardProps) {
    return (
        <Card className="min-h-[120px]">
            <CardContent className="p-6">
                <div className="flex gap-5">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center`}>
                        <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-4xl font-bold">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}