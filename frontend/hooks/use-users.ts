import { User } from '@/types/db';
import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface CreateUserData {
	username: string;
	email: string;
	password: string;
	role: string;
}

export interface UpdateUserData {
	username?: string;
	email?: string;
	password?: string;
	role?: string;
	email_verified?: boolean;
}

export function useUsers() {
	const { data: session } = useSession();
	const token = (session)?.accessToken;
	const [users, setUsers] = useState<User[]>([]);
	const [totalUsers, setTotalUsers] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const usersPerPage = 20;

	const loadUsers = useCallback(async (page = 1) => {
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

	const createUser = useCallback(async (userData: CreateUserData) => {
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

	const updateUser = useCallback(async (userId: string, userData: UpdateUserData) => {
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

	useEffect(() => {
		loadUsers();
	}, [loadUsers]);

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
