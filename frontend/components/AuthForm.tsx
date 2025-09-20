'use client';

import { useState } from 'react';

interface AuthFormProps {
  onSuccess?: (data: any) => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasUpperCase = (str: string): boolean => /[A-Z]/.test(str);
  const hasLowerCase = (str: string): boolean => /[a-z]/.test(str);
  const hasNumber = (str: string): boolean => /\d/.test(str);
  const hasSpecialChar = (str: string): boolean => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(str);

  const validateLoginForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!loginForm.identifier) {
      newErrors.identifier = 'Email или имя пользователя обязательно';
    } else if (loginForm.identifier.includes('@')) {
      if (!validateEmail(loginForm.identifier)) {
        newErrors.identifier = 'Введите корректный email';
      }
    } else {
      if (loginForm.identifier.length < 3) {
        newErrors.identifier = 'Имя пользователя должно содержать не менее 3 символов';
      }
    }

    if (!loginForm.password) {
      newErrors.password = 'Пароль обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!registerForm.username) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (registerForm.username.length < 3) {
      newErrors.username = 'Имя пользователя должно содержать не менее 3 символов';
    }

    if (!registerForm.email) {
      newErrors.email = 'Email обязателен';
    } else if (!validateEmail(registerForm.email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (!registerForm.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (registerForm.password.length < 8) {
      newErrors.password = 'Пароль должен содержать не менее 8 символов';
    } else if (!hasUpperCase(registerForm.password) || !hasLowerCase(registerForm.password) ||
               !hasNumber(registerForm.password) || !hasSpecialChar(registerForm.password)) {
      newErrors.password = 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы';
    }

    if (!registerForm.confirmPassword) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (!registerForm.terms) {
      showNotification('Необходимо принять условия использования', 'error');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
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

        onSuccess?.(data);
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(data.message || 'Регистрация успешна!', 'success');
        setActiveTab('login');
        setRegisterForm({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          terms: false
        });
        setErrors({});
      } else {
        showNotification(data.error || 'Произошла ошибка', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      showNotification('Произошла ошибка при отправке формы', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center px-5">
      <div className="bg-gray-800 rounded-xl p-10 w-full max-w-md mx-auto shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">J</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
              JIKO
            </h1>
          </div>
          <p className="text-gray-400 text-sm">Современная платформа для управления активами</p>
        </div>

        <div className="flex border-b border-gray-600 mb-6">
          <button
            className={`flex-1 py-3 px-4 font-medium cursor-pointer transition-colors border-b-2 ${
              activeTab === 'login'
                ? 'text-white border-cyan-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 py-3 px-4 font-medium cursor-pointer transition-colors border-b-2 ${
              activeTab === 'register'
                ? 'text-white border-cyan-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
            onClick={() => setActiveTab('register')}
          >
            Registration
          </button>
        </div>

        <div className="auth-forms">
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="block">
              <div className="mb-5">
                <label htmlFor="login-identifier" className="block mb-2 font-medium text-white">
                  Email or Username
                </label>
                <input
                  type="text"
                  id="login-identifier"
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, identifier: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 transition-all focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  required
                />
                {errors.identifier && (
                  <div className="text-red-400 text-xs mt-1">{errors.identifier}</div>
                )}
              </div>
              <div className="mb-5">
                <label htmlFor="login-password" className="block mb-2 font-medium text-white">
                  Password
                </label>
                <input
                  type="password"
                  id="login-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 transition-all focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  required
                />
                {errors.password && (
                  <div className="text-red-400 text-xs mt-1">{errors.password}</div>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-cyan-500 text-black font-semibold rounded-lg cursor-pointer transition-all hover:bg-cyan-400 mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Вход...' : 'Login'}
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="block">
              <div className="mb-5">
                <label htmlFor="register-username" className="block mb-2 font-medium text-white">
                  Username
                </label>
                <input
                  type="text"
                  id="register-username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 transition-all focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  required
                  minLength={3}
                />
                {errors.username && (
                  <div className="text-red-400 text-xs mt-1">{errors.username}</div>
                )}
              </div>
              <div className="mb-5">
                <label htmlFor="register-email" className="block mb-2 font-medium text-white">
                  Email
                </label>
                <input
                  type="email"
                  id="register-email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 transition-all focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  required
                />
                {errors.email && (
                  <div className="text-red-400 text-xs mt-1">{errors.email}</div>
                )}
              </div>
              <div className="mb-5">
                <label htmlFor="register-password" className="block mb-2 font-medium text-white">
                  Password
                </label>
                <input
                  type="password"
                  id="register-password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 transition-all focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  required
                  minLength={8}
                />
                <p className="text-gray-400 text-xs mt-1">
                  Must contain uppercase, lowercase letters, numbers, and special characters
                </p>
                {errors.password && (
                  <div className="text-red-400 text-xs mt-1">{errors.password}</div>
                )}
              </div>
              <div className="mb-5">
                <label htmlFor="register-confirm-password" className="block mb-2 font-medium text-white">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="register-confirm-password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 transition-all focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  required
                />
                {errors.confirmPassword && (
                  <div className="text-red-400 text-xs mt-1">{errors.confirmPassword}</div>
                )}
              </div>
              <div className="flex items-center justify-between mb-5">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={registerForm.terms}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, terms: e.target.checked }))}
                    className="mr-3 w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400 focus:ring-2"
                    required
                  />
                  <span className="text-sm text-gray-400">I accept the terms of use</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-cyan-500 text-black font-semibold rounded-lg cursor-pointer transition-all hover:bg-cyan-400 mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Регистрация...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 p-4 rounded-lg text-white shadow-lg transform transition-all duration-300 z-50 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}