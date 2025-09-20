'use client';

import { useState, useEffect } from 'react';
import { useUsers, User } from '../../../lib/hooks/useAdmin';
import { useAdminAuth } from '../../../lib/hooks/useAdmin';
import { useNotification } from '../../../components/Notification';
import { Modal } from '../../../components/Modal';
import { ConfirmDialog } from '../../../components/Modal';

export default function Users() {
    const { token } = useAdminAuth();
    const {
        users,
        totalUsers,
        currentPage,
        loading,
        usersPerPage,
        loadUsers,
        createUser,
        updateUser,
        deleteUser
    } = useUsers(token);
    const { showNotification, NotificationComponent } = useNotification();

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);

    // Form states
    const [createForm, setCreateForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user'
    });

    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user',
        email_verified: false
    });

    useEffect(() => {
        if (token) {
            loadUsers();
        }
    }, [token, loadUsers]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await createUser(createForm);
        if (success) {
            showNotification('Пользователь создан успешно', 'success');
            setShowCreateModal(false);
            setCreateForm({
                username: '',
                email: '',
                password: '',
                role: 'user'
            });
            loadUsers();
        } else {
            showNotification('Ошибка при создании пользователя', 'error');
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const formData: any = { ...editForm };
        if (!formData.password) {
            delete formData.password;
        }

        const success = await updateUser(editingUser.id, formData);
        if (success) {
            showNotification('Пользователь обновлен успешно', 'success');
            setShowEditModal(false);
            setEditingUser(null);
            loadUsers();
        } else {
            showNotification('Ошибка при обновлении пользователя', 'error');
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        const success = await deleteUser(userToDelete.id);
        if (success) {
            showNotification('Пользователь удален успешно', 'success');
            loadUsers();
        } else {
            showNotification('Ошибка при удалении пользователя', 'error');
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditForm({
            username: user.username,
            email: user.email,
            password: '',
            role: user.role,
            email_verified: user.email_verified
        });
        setShowEditModal(true);
    };

    const openDeleteDialog = (user: User) => {
        setUserToDelete({ id: user.id, username: user.username });
        setShowDeleteDialog(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalPages = Math.ceil(totalUsers / usersPerPage);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-medium text-white">Пользователи</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    + Создать пользователя
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Имя</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Роль</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Верификация</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Создан</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.email_verified ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                            }`}>
                                            {user.email_verified ? 'Да' : 'Нет'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="text-blue-400 hover:text-blue-300 mr-3"
                                        >
                                            Изменить
                                        </button>
                                        <button
                                            onClick={() => openDeleteDialog(user)}
                                            disabled={user.role === 'admin'}
                                            className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => loadUsers(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ‹ Предыдущая
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => loadUsers(page)}
                            disabled={loading}
                            className={`px-3 py-1 border rounded ${page === currentPage
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => loadUsers(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="px-3 py-1 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Следующая ›
                    </button>
                </div>
            )}

            {/* Create User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Создать пользователя"
            >
                <form onSubmit={handleCreateUser} className="p-6">
                    <div className="mb-4">
                        <label htmlFor="create-username" className="block mb-2 text-gray-300 text-sm">
                            Имя пользователя
                        </label>
                        <input
                            type="text"
                            id="create-username"
                            value={createForm.username}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="create-email" className="block mb-2 text-gray-300 text-sm">
                            Email
                        </label>
                        <input
                            type="email"
                            id="create-email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="create-password" className="block mb-2 text-gray-300 text-sm">
                            Пароль
                        </label>
                        <input
                            type="password"
                            id="create-password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="create-role" className="block mb-2 text-gray-300 text-sm">
                            Роль
                        </label>
                        <select
                            id="create-role"
                            value={createForm.role}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="user">Пользователь</option>
                            <option value="admin">Администратор</option>
                        </select>
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

            {/* Edit User Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Редактировать пользователя"
            >
                <form onSubmit={handleEditUser} className="p-6">
                    <div className="mb-4">
                        <label htmlFor="edit-username" className="block mb-2 text-gray-300 text-sm">
                            Имя пользователя
                        </label>
                        <input
                            type="text"
                            id="edit-username"
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="edit-email" className="block mb-2 text-gray-300 text-sm">
                            Email
                        </label>
                        <input
                            type="email"
                            id="edit-email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="edit-password" className="block mb-2 text-gray-300 text-sm">
                            Новый пароль (оставьте пустым, чтобы не менять)
                        </label>
                        <input
                            type="password"
                            id="edit-password"
                            value={editForm.password}
                            onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="edit-role" className="block mb-2 text-gray-300 text-sm">
                            Роль
                        </label>
                        <select
                            id="edit-role"
                            value={editForm.role}
                            onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="user">Пользователь</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="edit-email-verified"
                                checked={editForm.email_verified}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email_verified: e.target.checked }))}
                                className="mr-3 w-4 h-4 text-blue-600 border-gray-600 rounded bg-gray-700 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-300">Email подтвержден</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="px-4 py-2 text-gray-300 hover:text-white"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteUser}
                title="Удалить пользователя"
                message={`Вы уверены, что хотите удалить пользователя "${userToDelete?.username}"?`}
                confirmText="Удалить"
            />

            {NotificationComponent}
        </div>
    );
}