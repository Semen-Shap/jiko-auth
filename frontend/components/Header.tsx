"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
	const { user, isAuthenticated, logout, isAdmin } = useAuth();

	if (!isAuthenticated || !user) {
		return null;
	}

	return (
		<header className="w-full h-[50px] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
			<div className="container mx-auto px-4 py-3">
				<div className="flex items-center justify-between h-full">
					{/* Logo/Brand */}
					<div className="flex items-center">
						<Link href="/" className="text-xl font-bold">
							JIKO
						</Link>
					</div>

					{/* Navigation & User Controls */}
					<div className="flex items-center gap-3">
						<ThemeToggle />

						{isAdmin && (
							<Link href="/admin">
								<Button variant="outline" size="sm">
									Admin Panel
								</Button>
							</Link>
						)}

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Avatar className="cursor-pointer hover:opacity-80 transition-opacity h-8 w-8">
									<AvatarImage src="" alt={user.username} />
									<AvatarFallback className="bg-primary text-primary-foreground text-sm">
										{user.username.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">{user.username}</p>
										<p className="text-xs leading-none text-muted-foreground">
											{user.email || 'No email'}
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link href="/user" className="cursor-pointer">
										Profile
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={logout}
									className="cursor-pointer text-destructive"
								>
									Logout
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	);
}
