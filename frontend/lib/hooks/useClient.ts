import { useState, useEffect, useCallback } from 'react';

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    email_verified: boolean;
    created_at: string;
}

export interface Client {
    id: string;
    name: string;
    username: string;
    email: string;
    redirect_uris: string[];
    created_at: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export function useAuth() {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const clientToken = localStorage.getItem('client_token');
        const clientUser = localStorage.getItem('client_user');
        if (clientToken && clientUser) {
            setToken(clientToken);
            setUser(JSON.parse(clientUser));
            setIsAuthenticated(true);
        }
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data: AuthResponse = await response.json();
                setToken(data.token);
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('client_token', data.token);
                localStorage.setItem('client_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, error: 'Network error' };
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (userData: { username: string; email: string; password: string }) => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Error registering:', error);
            return { success: false, error: 'Network error' };
        } finally {
            setLoading(false);
        }
    }, []);

    const verifyEmail = useCallback(async (token: string) => {
        try {
            const response = await fetch(`/api/v1/auth/verify-email?token=${token}`);

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: 'Verification failed' };
            }
        } catch (error) {
            console.error('Error verifying email:', error);
            return { success: false, error: 'Network error' };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('client_token');
        localStorage.removeItem('client_user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    }, []);

    return {
        token,
        user,
        isAuthenticated,
        loading,
        login,
        register,
        verifyEmail,
        logout
    };
}

export function useProfile(token: string | null) {
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const loadProfile = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            // Assuming there's an endpoint to get current user profile
            // If not, this might need to be adjusted based on actual API
            const response = await fetch('/api/v1/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const profileData = await response.json();
                setProfile(profileData);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const updateProfile = useCallback(async (profileData: Partial<User>) => {
        if (!token) return;

        try {
            const response = await fetch('/api/v1/auth/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (response.ok) {
                const updatedProfile = await response.json();
                setProfile(updatedProfile);
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: 'Network error' };
        }
    }, [token]);

    return {
        profile,
        loading,
        loadProfile,
        updateProfile
    };
}

export function useClients(token: string | null) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);

    const loadClients = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch('/api/v1/clients', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const clientsData = await response.json();
                setClients(clientsData);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const createClient = useCallback(async (clientData: { name: string; redirect_uris: string[] }) => {
        if (!token) return;

        try {
            const response = await fetch('/api/v1/clients', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });

            if (response.ok) {
                const newClient = await response.json();
                setClients(prev => [...prev, newClient]);
                return { success: true, client: newClient };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Error creating client:', error);
            return { success: false, error: 'Network error' };
        }
    }, [token]);

    const createToken = useCallback(async (clientId: string) => {
        if (!token) return;

        try {
            const response = await fetch(`/api/v1/clients/${clientId}/tokens`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const tokenData = await response.json();
                return { success: true, token: tokenData };
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Error creating token:', error);
            return { success: false, error: 'Network error' };
        }
    }, [token]);

    return {
        clients,
        loading,
        loadClients,
        createClient,
        createToken
    };
}