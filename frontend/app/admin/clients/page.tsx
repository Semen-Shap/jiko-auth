'use client';

import { useState, useEffect } from 'react';
import { useClients, Client } from '../../../lib/hooks/useAdmin';
import { useAdminAuth } from '../../../lib/hooks/useAdmin';
import { useNotification } from '../../../components/Notification';
import { CreateClientModal } from './CreateClientModal';
import { DeleteClientModal } from './DeleteClientModal';
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

export default function Clients() {
    const { token } = useAdminAuth();
    const {
        clients,
        totalClients,
        currentPage,
        loading,
        clientsPerPage,
        loadClients,
        createClient,
        deleteClient
    } = useClients(token);
    const { showNotification, NotificationComponent } = useNotification();

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        if (token) {
            loadClients();
        }
    }, [token, loadClients]);

    const handleCreateClient = async (clientData: {
        name: string;
        username: string;
        email: string;
        password: string;
        redirect_uris: string[];
    }) => {
        const result = await createClient(clientData);
        if (result) {
            showNotification('Клиент создан успешно', 'success');
            alert(`Клиент создан!\nID: ${result.id}\nSecret: ${result.secret}\n\nСОХРАНИТЕ SECRET - он больше не будет показан!`);
            setShowCreateModal(false);
            loadClients();
            return true;
        } else {
            showNotification('Ошибка при создании клиента', 'error');
            return false;
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
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    + Создать клиента
                </Button>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mb-6">
                <Table>
                    <TableHeader className="bg-gray-700">
                        <TableRow>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Имя</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Пользователь</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Redirect URIs</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Создан</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-700">
                        {clients.map((client) => (
                            <TableRow key={client.id} className="hover:bg-gray-700">
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.id}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.name}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.username}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.email}</TableCell>
                                <TableCell className="px-6 py-4 text-sm text-gray-400">
                                    {client.redirect_uris.map((uri, index) => (
                                        <div key={index}>{uri}</div>
                                    ))}
                                </TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {formatDate(client.created_at)}
                                </TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(client)}
                                        className="text-red-400 hover:text-red-300"
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
            {Math.ceil(totalClients / clientsPerPage) > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => loadClients(currentPage - 1)}
                                className={currentPage === 1 || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                                Предыдущая
                            </PaginationPrevious>
                        </PaginationItem>
                        {Array.from({ length: Math.ceil(totalClients / clientsPerPage) }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    onClick={() => loadClients(page)}
                                    isActive={page === currentPage}
                                    className={loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => loadClients(currentPage + 1)}
                                className={currentPage === Math.ceil(totalClients / clientsPerPage) || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            >
                                Следующая
                                <ChevronRightIcon className="h-4 w-4" />
                            </PaginationNext>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {/* Create Client Modal */}
            <CreateClientModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateClient}
                loading={loading}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteClientModal
                isOpen={showDeleteDialog}
                onClose={() => { setShowDeleteDialog(false); setClientToDelete(null); }}
                onConfirm={handleDeleteClient}
                client={clientToDelete}
                loading={loading}
            />

            {NotificationComponent}
        </div>
    );
}