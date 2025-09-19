"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";

interface User {
	id: string;
	username: string;
	email: string;
	role: string;
}

export default function Home() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		checkAuthStatus();
	}, []);

	const checkAuthStatus = async () => {
		const token = localStorage.getItem("access_token");
		
		if (!token) {
			setIsLoading(false);
			return;
		}

		try {
			const response = await apiClient.getCurrentUser();

			if (response.data) {
				setUser(response.data);
			} else {
				// Токен недействителен, удаляем его
				localStorage.removeItem("access_token");
				localStorage.removeItem("user");
			}
		} catch (error) {
			console.error("Error checking auth status:", error);
			localStorage.removeItem("access_token");
			localStorage.removeItem("user");
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("access_token");
		localStorage.removeItem("user");
		setUser(null);
		router.push("/login");
	};

	if (isLoading) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-secondary">Загрузка...</p>
				</div>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background">
			<div className="max-w-md w-full bg-background p-8 rounded-lg shadow-md text-center border border-border">
				<h1 className="text-3xl font-bold mb-6 text-foreground">Jiko Bridge</h1>
				
				{user ? (
					<div>
						<div className="mb-6 p-4 bg-success/10 rounded-lg border border-success/20">
							<h2 className="text-xl font-semibold text-success mb-2">
								Добро пожаловать, {user.username}!
							</h2>
							<p className="text-success">Email: {user.email}</p>
							<p className="text-success">Роль: {user.role}</p>
						</div>
						
						<button
							onClick={handleLogout}
							className="w-full py-2 px-4 bg-error text-foreground rounded-md hover:bg-error/80 focus:outline-none focus:ring-2 focus:ring-error"
						>
							Выйти
						</button>
					</div>
				) : (
					<div>
						<p className="text-muted mb-6">
							Добро пожаловать в Jiko Bridge. Войдите в свой аккаунт или зарегистрируйтесь.
						</p>
						
						<div className="space-y-3">
							<a
								href="/login"
								className="block w-full py-2 px-4 bg-primary text-foreground rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary text-center"
							>
								Войти
							</a>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
