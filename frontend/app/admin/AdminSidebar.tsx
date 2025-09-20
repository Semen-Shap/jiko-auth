'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Link as LinkIcon } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

export default function AdminSidebar() {
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'OAuth Clients', href: '/admin/clients', icon: LinkIcon },
    ];

    return (
        <Sidebar variant="inset">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">Admin Panel</span>
                        <span className="text-xs text-muted-foreground">JIKO</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navigation.map((item) => (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={item.name}
                            >
                                <Link href={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}