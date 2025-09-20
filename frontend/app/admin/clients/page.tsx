'use client';

import { useState, useEffect } from 'react';
import { useClients, Client } from '../../../lib/hooks/useAdmin';
import { useAdminAuth } from '../../../lib/hooks/useAdmin';
import { useNotification } from '../../../components/Notification';
import { Modal } from '../../../components/Modal';
import { ConfirmDialog } from '../../../components/Modal';

export default function Clients() {
    const { token } = useAdminAuth();
    const {
        clients,
        loading,
        loadClients,
        createClient,
        deleteClient
    } = useClients(token);
    const { showNotification, NotificationComponent } = useNotification();

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

    // Form state
    const [createForm, setCreateForm] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        redirect_uris: ''
    });

    useEffect(() => {
        if (token) {
            loadClients();
        }
    }, [token, loadClients]);

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = {
            ...createForm,
            redirect_uris: createForm.redirect_uris.split('\n')
                .map(uri => uri.trim())
                .filter(uri => uri.length > 0)
        };

        const result = await createClient(formData);
        if (result) {
            showNotification('Клиент создан успешно', 'success');
            alert(`Клиент создан!\nID: ${result.id}\nSecret: ${result.secret}\n\nСОХРАНИТЕ SECRET - он больше не будет показан!`);
            setShowCreateModal(false);
            setCreateForm({
                name: '',
                username: '',
                email: '',
                password: '',
                redirect_uris: ''
            });
            loadClients();
        } else {
            showNotification('Ошибка при создании клиента', 'error');
        }
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;

        const success = await deleteClient(clientToDelete.id);
        if (success) {
            showNotification('Клиент удален успешно', 'success');
            loadClients();
        } else {
            showNotification('Ошибка при удалении клиента', 'error');
        }
    };

    const openDeleteDialog = (client: Client) => {
        setClientToDelete({ id: client.id, name: client.name });
        setShowDeleteDialog(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-medium text-white">OAuth Клиенты</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    + Создать клиента
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Имя</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Пользователь</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Redirect URIs</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Создан</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {client.redirect_uris.map((uri, index) => (
                                            <div key={index}>{uri}</div>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {formatDate(client.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => openDeleteDialog(client)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Client Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Создать OAuth клиента"
            >
                <form onSubmit={handleCreateClient} className="p-6">
                    <div className="mb-4">
                        <label htmlFor="client-name" className="block mb-2 text-gray-300 text-sm">
                            Имя клиента
                        </label>
                        <input
                            type="text"
                            id="client-name"
                            value={createForm.name}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="client-username" className="block mb-2 text-gray-300 text-sm">
                            Имя пользователя
                        </label>
                        <input
                            type="text"
                            id="client-username"
                            value={createForm.username}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="client-email" className="block mb-2 text-gray-300 text-sm">
                            Email
                        </label>
                        <input
                            type="email"
                            id="client-email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="client-password" className="block mb-2 text-gray-300 text-sm">
                            Пароль
                        </label>
                        <input
                            type="password"
                            id="client-password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="redirect-uris" className="block mb-2 text-gray-300 text-sm">
                            Redirect URIs (по одному на строку)
                        </label>
                        <textarea
                            id="redirect-uris"
                            value={createForm.redirect_uris}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, redirect_uris: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            rows={4}
                            placeholder="https://example.com/callback&#10;https://app.example.com/oauth/callback"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 text-gray-300 hover:text-white"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Создание...' : 'Создать'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteClient}
                title="Удалить клиента"
                message={`Вы уверены, что хотите удалить клиента "${clientToDelete?.name}"?`}
                confirmText="Удалить"
            />

            {NotificationComponent}
        </div>
    );
}