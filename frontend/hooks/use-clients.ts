import { Client } from '@/types/db';
import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface CreateClientData {
	name: string;
	redirect_uris: string[];
}

export function useClients() {
	const { data: session } = useSession();
	const token = session?.accessToken;
	const [clients, setClients] = useState<Client[]>([]);
	const [totalClients, setTotalClients] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const clientsPerPage = 20;

	const loadClients = useCallback(async (page = 1) => {
		setLoading(true);
		try {
			const offset = (page - 1) * clientsPerPage;
			const response = await fetch(`/api/v1/admin/clients?limit=${clientsPerPage}&offset=${offset}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				setClients(data.clients || data);
				setTotalClients(data.count || data.length);
				setCurrentPage(page);
			}
		} catch (error) {
			console.error('Error loading clients:', error);
		} finally {
			setLoading(false);
		}
	}, [token, clientsPerPage]);

	const createClient = useCallback(async (clientData: CreateClientData) => {
		try {
			const response = await fetch('/api/v1/admin/oauth/clients', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: clientData.name,
					redirect_uris: clientData.redirect_uris
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Error creating client:', errorData);
				return null;
			}

			const client = await response.json();
			return client;
		} catch (error) {
			console.error('Error creating client:', error);
			return null;
		}
	}, [token]);

	const deleteClient = useCallback(async (clientId: string) => {
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

	useEffect(() => {
		loadClients();
	}, [loadClients]);

	return {
		clients,
		totalClients,
		currentPage,
		loading,
		clientsPerPage,
		loadClients,
		createClient,
		deleteClient
	};
}