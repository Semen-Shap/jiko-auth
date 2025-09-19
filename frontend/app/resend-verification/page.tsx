"use client";

import { useState } from "react";
import apiClient from "@/lib/api";

interface ResendVerificationProps {
	email?: string;
}

export default function ResendVerification({ email: initialEmail }: ResendVerificationProps) {
	const [email, setEmail] = useState(initialEmail || "");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!email) {
			setError("Email обязателен");
			return;
		}

		setIsLoading(true);
		setMessage("");
		setError("");

		try {
			const response = await apiClient.resendVerification(email);

			if (response.error) {
				setError(response.error);
			} else {
				setMessage("Письмо подтверждения отправлено повторно. Проверьте вашу почту.");
			}
		} catch (err) {
			console.error("Resend verification error:", err);
			setError("Ошибка сети. Попробуйте позже.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
			<h2 className="text-xl font-bold mb-4 text-center text-gray-900">
				Повторная отправка подтверждения
			</h2>
			
			{message && (
				<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
					{message}
				</div>
			)}

			{error && (
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit}>
				<div className="mb-4">
					<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
						Email
					</label>
					<input
						type="email"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Введите ваш email"
						required
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
						isLoading ? "bg-blue-400" : ""
					}`}
				>
					{isLoading ? "Отправка..." : "Отправить повторно"}
				</button>
			</form>

			<div className="mt-4 text-center">
				<a href="/login" className="text-sm text-blue-600 hover:text-blue-500">
					Вернуться к входу
				</a>
			</div>
		</div>
	);
}
