import { useState, useEffect } from 'react';

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    email_verified: boolean;
    created_at: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setToken(storedToken);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    };

    return {
        user,
        token,
        isAuthenticated,
        isLoading,
        logout,
        isAdmin: user?.role === 'admin'
    };
}