"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";

export default function Auth() {
	const [isLogin, setIsLogin] = useState(true);
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState("");
	
	const router = useRouter();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
		// Очищаем ошибку для этого поля при изменении
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ""
			}));
		}
	};

	const validateForm = () => {
		const newErrors: { [key: string]: string } = {};

		if (!isLogin) {
			if (!formData.username.trim()) {
				newErrors.username = "Имя пользователя обязательно";
			} else if (formData.username.length < 3) {
				newErrors.username = "Имя пользователя должно содержать минимум 3 символа";
			}
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email обязателен";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Неверный формат email";
		}

		if (!formData.password) {
			newErrors.password = "Пароль обязателен";
		} else if (formData.password.length < 8) {
			newErrors.password = "Пароль должен содержать минимум 8 символов";
		}

		if (!isLogin && formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Пароли не совпадают";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		setIsLoading(true);
		setMessage("");
		setErrors({});

		try {
			if (isLogin) {
				const response = await apiClient.login({
					email: formData.email,
					password: formData.password,
				});

				if (response.error) {
					if (response.error === "email not verified") {
						setErrors({ general: "Email не подтвержден. Проверьте вашу почту." });
					} else {
						setErrors({ general: response.error });
					}
				} else if (response.data) {
					// Сохраняем токен в localStorage
					localStorage.setItem("access_token", response.data.access_token);
					localStorage.setItem("user", JSON.stringify(response.data.user));
					
					// Перенаправляем на главную страницу или дашборд
					router.push("/");
				}
			} else {
				const response = await apiClient.register({
					username: formData.username,
					email: formData.email,
					password: formData.password,
				});

				if (response.error) {
					setErrors({ general: response.error });
				} else {
					setMessage("Регистрация успешна! Проверьте вашу почту для подтверждения аккаунта.");
					// Переключаемся на вход через 3 секунды
					setTimeout(() => {
						setIsLogin(true);
						setMessage("");
					}, 3000);
				}
			}
		} catch (error) {
			console.error("Auth error:", error);
			setErrors({ general: "Ошибка сети. Попробуйте позже." });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background">
			<div className="w-full max-w-md">
				<div className="bg-background p-8 rounded-lg shadow-md border border-border">
					<div className="flex mb-6">
						<button
							type="button"
							onClick={() => setIsLogin(true)}
							className={`flex-1 py-2 px-4 text-center font-medium rounded-l-md transition-colors ${
								isLogin 
									? "bg-primary text-primary-foreground hover:bg-primary-hover" 
									: "bg-secondary text-secondary-foreground hover:bg-secondary-hover"
							}`}
						>
							Вход
						</button>
						<button
							type="button"
							onClick={() => setIsLogin(false)}
							className={`flex-1 py-2 px-4 text-center font-medium rounded-r-md transition-colors ${
								!isLogin 
									? "bg-primary text-primary-foreground hover:bg-primary-hover" 
									: "bg-secondary text-secondary-foreground hover:bg-secondary-hover"
							}`}
						>
							Регистрация
						</button>
					</div>

					<form onSubmit={handleSubmit}>
						<h2 className="text-2xl font-bold mb-6 text-center text-foreground">
							{isLogin ? "Вход" : "Регистрация"}
						</h2>
						
						{message && (
							<div className="mb-4 p-3 bg-success/10 rounded-lg border border-success/20 text-success">
								{message}
							</div>
						)}

						{errors.general && (
							<div className="mb-4 p-3 bg-error/10 rounded-lg border border-error/20 text-error">
								{errors.general}
							</div>
						)}

						{!isLogin && (
							<div className="mb-4">
								<label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
									Имя пользователя
								</label>
								<input
									type="text"
									id="username"
									name="username"
									value={formData.username}
									onChange={handleChange}
									className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
										errors.username ? "border-error" : "border-border"
									}`}
									placeholder="Введите имя пользователя"
								/>
								{errors.username && (
									<p className="text-error text-xs mt-1">{errors.username}</p>
								)}
							</div>
						)}

						<div className="mb-4">
							<label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
								Email
							</label>
							<input
								type="email"
								id="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
									errors.email ? "border-error" : "border-border"
								}`}
								placeholder="Введите email"
							/>
							{errors.email && (
								<p className="text-error text-xs mt-1">{errors.email}</p>
							)}
						</div>

						<div className="mb-4">
							<label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
								Пароль
							</label>
							<input
								type="password"
								id="password"
								name="password"
								value={formData.password}
								onChange={handleChange}
								className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
									errors.password ? "border-error" : "border-border"
								}`}
								placeholder="Введите пароль"
							/>
							{errors.password && (
								<p className="text-error text-xs mt-1">{errors.password}</p>
							)}
						</div>

						{!isLogin && (
							<div className="mb-6">
								<label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
									Подтвердите пароль
								</label>
								<input
									type="password"
									id="confirmPassword"
									name="confirmPassword"
									value={formData.confirmPassword}
									onChange={handleChange}
									className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
										errors.confirmPassword ? "border-error" : "border-border"
									}`}
									placeholder="Подтвердите пароль"
								/>
								{errors.confirmPassword && (
									<p className="text-error text-xs mt-1">{errors.confirmPassword}</p>
								)}
							</div>
						)}

						<button
							type="submit"
							disabled={isLoading}
							className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-foreground bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
								isLoading ? "bg-primary/70" : ""
							}`}
						>
							{isLoading ? (isLogin ? "Вход..." : "Регистрация...") : (isLogin ? "Войти" : "Зарегистрироваться")}
						</button>
					</form>
				</div>
			</div>
		</main>
	);
}
