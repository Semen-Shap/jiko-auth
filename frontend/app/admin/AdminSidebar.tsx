'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminSidebar() {
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'OAuth Clients', href: '/admin/clients', icon: LinkIcon },
    ];

    return (
        <Card className="w-64 rounded-none">
            <CardContent className="p-6">
                <nav>
                    <ul className="space-y-2">
                        {navigation.map((item) => (
                            <li key={item.name}>
                                <Button
                                    asChild
                                    variant={pathname === item.href ? "default" : "ghost"}
                                    className="w-full justify-start gap-3"
                                >
                                    <Link href={item.href}>
                                        <item.icon className="w-4 h-4" />
                                        <span className="text-sm">{item.name}</span>
                                    </Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </CardContent>
        </Card>
    );
}