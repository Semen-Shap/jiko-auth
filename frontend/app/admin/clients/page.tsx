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
                >
                    + Создать клиента
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Имя</TableHead>
                            <TableHead>Пользователь</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Redirect URIs</TableHead>
                            <TableHead>Создан</TableHead>
                            <TableHead>Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell>{client.id}</TableCell>
                                <TableCell>{client.name}</TableCell>
                                <TableCell>{client.username}</TableCell>
                                <TableCell>{client.email}</TableCell>
                                <TableCell>
                                    {client.redirect_uris.map((uri, index) => (
                                        <div key={index}>{uri}</div>
                                    ))}
                                </TableCell>
                                <TableCell>{formatDate(client.created_at)}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(client)}
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