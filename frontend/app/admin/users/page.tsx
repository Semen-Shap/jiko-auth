'use client';

import { useState, useEffect } from 'react';
import { useUsers, User } from '../../../lib/hooks/useAdmin';
import { useAdminAuth } from '../../../lib/hooks/useAdmin';
import { useNotification } from '../../../components/Notification';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

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

    useEffect(() => {
        if (token) {
            loadUsers();
        }
    }, [token, loadUsers]);

    const handleCreateUser = async (userData: {
        username: string;
        email: string;
        password: string;
        role: string;
    }) => {
        const success = await createUser(userData);
        if (success) {
            showNotification('Пользователь создан успешно', 'success');
            setShowCreateModal(false);
            loadUsers();
            return true;
        } else {
            showNotification('Ошибка при создании пользователя', 'error');
            return false;
        }
    };

    const handleEditUser = async (userData: {
        username: string;
        email: string;
        password?: string;
        role: string;
        email_verified: boolean;
    }) => {
        if (!editingUser) return false;

        const success = await updateUser(editingUser.id, userData);
        if (success) {
            showNotification('Пользователь обновлен успешно', 'success');
            setShowEditModal(false);
            setEditingUser(null);
            loadUsers();
            return true;
        } else {
            showNotification('Ошибка при обновлении пользователя', 'error');
            return false;
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
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    + Создать пользователя
                </Button>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mb-6">
                <Table>
                    <TableHeader className="bg-gray-700">
                        <TableRow>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Имя</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Роль</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Верификация</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Создан</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-700">
                        {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-gray-700">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.id}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.username}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'
                                        }`}>
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.email_verified ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                        }`}>
                                        {user.email_verified ? 'Да' : 'Нет'}
                                    </span>
                                </TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {formatDate(user.created_at)}
                                </TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEditModal(user)}
                                        className="text-blue-400 hover:text-blue-300 mr-3"
                                    >
                                        Изменить
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(user)}
                                        disabled={user.role === 'admin'}
                                        className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Удалить
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => loadUsers(currentPage - 1)}
                                className={currentPage === 1 || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                                Предыдущая
                            </PaginationPrevious>
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    onClick={() => loadUsers(page)}
                                    isActive={page === currentPage}
                                    className={loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => loadUsers(currentPage + 1)}
                                className={currentPage === totalPages || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            >
                                Следующая
                                <ChevronRightIcon className="h-4 w-4" />
                            </PaginationNext>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {/* Create User Modal */}
            <CreateUserModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateUser}
                loading={loading}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={showEditModal}
                onClose={() => { setShowEditModal(false); setEditingUser(null); }}
                onSubmit={handleEditUser}
                user={editingUser}
                loading={loading}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteUserModal
                isOpen={showDeleteDialog}
                onClose={() => { setShowDeleteDialog(false); setUserToDelete(null); }}
                onConfirm={handleDeleteUser}
                user={userToDelete}
                loading={loading}
            />

            {NotificationComponent}
        </div>
    );
}