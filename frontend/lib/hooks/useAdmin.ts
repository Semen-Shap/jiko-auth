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

export interface Stats {
    total_users: number;
    total_verified_users: number;
    total_clients: number;
    new_users_today: number;
}

export function useAdminAuth() {
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const adminToken = localStorage.getItem('admin_token');
        if (adminToken) {
            setToken(adminToken);
            setIsAuthenticated(true);
        } else {
            window.location.href = '/';
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setToken(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    };

    return { token, isAuthenticated, logout };
}

export function useStats() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);

    const loadStats = useCallback(async (token: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const statsData = await response.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { stats, loading, loadStats };
}

export function useUsers(token: string | null) {
    const [users, setUsers] = useState<User[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const usersPerPage = 20;

    const loadUsers = useCallback(async (page = 1) => {
        if (!token) return;

        setLoading(true);
        try {
            const offset = (page - 1) * usersPerPage;
            const response = await fetch(`/api/v1/admin/users?limit=${usersPerPage}&offset=${offset}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setTotalUsers(data.count);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    }, [token, usersPerPage]);

    const createUser = useCallback(async (userData: any) => {
        if (!token) return;

        try {
            const response = await fetch('/api/v1/admin/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            return response.ok;
        } catch (error) {
            console.error('Error creating user:', error);
            return false;
        }
    }, [token]);

    const updateUser = useCallback(async (userId: string, userData: any) => {
        if (!token) return;

        try {
            const response = await fetch(`/api/v1/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            return response.ok;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }, [token]);

    const deleteUser = useCallback(async (userId: string) => {
        if (!token) return;

        try {
            const response = await fetch(`/api/v1/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }, [token]);

    return {
        users,
        totalUsers,
        currentPage,
        loading,
        usersPerPage,
        loadUsers,
        createUser,
        updateUser,
        deleteUser
    };
}

export function useClients(token: string | null) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);

    const loadClients = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch('/api/v1/admin/clients', {
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

    const createClient = useCallback(async (clientData: any) => {
        if (!token) return;

        try {
            const response = await fetch('/api/v1/admin/clients', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });

            return response.ok ? await response.json() : null;
        } catch (error) {
            console.error('Error creating client:', error);
            return null;
        }
    }, [token]);

    const deleteClient = useCallback(async (clientId: string) => {
        if (!token) return;

        try {
            const response = await fetch(`/api/v1/admin/clients/${clientId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Error deleting client:', error);
            return false;
        }
    }, [token]);

    return {
        clients,
        loading,
        loadClients,
        createClient,
        deleteClient
    };
}