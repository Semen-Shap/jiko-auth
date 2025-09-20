'use client';

import { useState, useEffect } from 'react';
import { useClients, Client } from '@/lib/hooks/useAdmin';
import { useAdminAuth } from '@/lib/hooks/useAdmin';
import { useNotification } from '@/components/Notification';
import { CreateClientModal } from './CreateClientModal';
import { DeleteClientModal } from './DeleteClientModal';
import { ClientCreatedModal } from './ClientCreatedModal';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSidebar } from '@/components/ui/sidebar';

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
    const [showCreatedModal, setShowCreatedModal] = useState(false);
    const [createdClient, setCreatedClient] = useState<{ id: string; secret: string } | null>(null);
    const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        if (token) {
            loadClients();
        }
    }, [token, loadClients]);

    const handleCreateClient = async (clientData: {
        name: string;
        redirect_uris: string[];
    }) => {
        const result = await createClient(clientData);
        if (result) {
            showNotification('Client created successfully', 'success');
            setCreatedClient({ id: result.id, secret: result.secret });
            setShowCreatedModal(true);
            setShowCreateModal(false);
            loadClients();
            return true;
        } else {
            showNotification('Error creating client', 'error');
            return false;
        }
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;

        const success = await deleteClient(clientToDelete.id);
        if (success) {
            showNotification('Client deleted successfully', 'success');
            loadClients();
        } else {
            showNotification('Error deleting client', 'error');
        }
    };

    const openDeleteDialog = (client: Client) => {
        setClientToDelete({ id: client.id, name: client.name });
        setShowDeleteDialog(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const { state } = useSidebar();
    const width = state === 'expanded'
        ? 'calc(100vw - var(--sidebar-width) - 50px)'
        : 'calc(100vw - 50px)';

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-medium text-white">OAuth Clients</h2>
                <Button
                    onClick={() => setShowCreateModal(true)}
                >
                    + Create Client
                </Button>
            </div>

            <ScrollArea
                style={{ width }}
                className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Redirect URIs</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell>{client.name}</TableCell>
                                <TableCell>{client.username}</TableCell>
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
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

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

            {/* Client Created Modal */}
            <ClientCreatedModal
                isOpen={showCreatedModal}
                onClose={() => {
                    setShowCreatedModal(false);
                    setCreatedClient(null);
                }}
                client={createdClient}
            />

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