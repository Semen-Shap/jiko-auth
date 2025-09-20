'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/components/Notification';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SignIn() {
    const [form, setForm] = useState({
        identifier: '',
        password: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { showNotification, NotificationComponent } = useNotification();

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.identifier) {
            newErrors.identifier = 'Email или имя пользователя обязательно';
        } else if (form.identifier.includes('@')) {
            if (!validateEmail(form.identifier)) {
                newErrors.identifier = 'Введите корректный email';
            }
        } else {
            if (form.identifier.length < 3) {
                newErrors.identifier = 'Имя пользователя должно содержать не менее 3 символов';
            }
        }

        if (!form.password) {
            newErrors.password = 'Пароль обязателен';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(data.message || 'Успешно!', 'success');

                // Проверяем, является ли пользователь админом
                if (data.user && data.user.role === 'admin') {
                    localStorage.setItem('admin_token', data.access_token);
                    localStorage.setItem('admin_user', JSON.stringify(data.user));
                    showNotification('Добро пожаловать в админ панель!', 'success');
                    setTimeout(() => {
                        window.location.href = '/admin';
                    }, 1000);
                } else {
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                }
            } else {
                showNotification(data.error || 'Произошла ошибка', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Произошла ошибка при отправке формы', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-5">
            <div className="absolute top-4 right-4 flex gap-2">
                <ThemeToggle />
                <Link href="/sign-up">
                    <Button variant="outline" size="sm">
                        Sign Up
                    </Button>
                </Link>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">
                        JIKO
                    </CardTitle>
                    <CardDescription>
                        Sign in to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">
                                Email or Username
                            </Label>
                            <Input
                                id="identifier"
                                type="text"
                                value={form.identifier}
                                onChange={(e) => setForm(prev => ({ ...prev, identifier: e.target.value }))}
                                required
                            />
                            {errors.identifier && (
                                <div className="text-red-400 text-xs">{errors.identifier}</div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                                required
                            />
                            {errors.password && (
                                <div className="text-red-400 text-xs">{errors.password}</div>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Вход...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {NotificationComponent}
        </div>
    );
}