'use client';

import { useState } from 'react';
import { useUsers, UpdateUserData } from '@/hooks/use-users';
import { User } from '@/types/db';
import { useNotification } from '@/components/NotificationProvider';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSidebar } from "@/components/ui/sidebar";

export default function Users() {
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
	} = useUsers();
	const { showNotification } = useNotification();

	// Modal states
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);

	const handleCreateUser = async (userData: {
		username: string;
		email: string;
		password: string;
		role: string;
	}) => {
		const success = await createUser(userData);
		if (success) {
			showNotification('User created successfully', 'success');
			setShowCreateModal(false);
			loadUsers();
			return true;
		} else {
			showNotification('Error creating user', 'error');
			return false;
		}
	};

	const handleEditUser = async (userData: UpdateUserData) => {
		if (!editingUser) return false;

		const success = await updateUser(editingUser.id, userData);
		if (success) {
			showNotification('User updated successfully', 'success');
			setShowEditModal(false);
			setEditingUser(null);
			loadUsers();
			return true;
		} else {
			showNotification('Error updating user', 'error');
			return false;
		}
	};

	const handleDeleteUser = async () => {
		if (!userToDelete) return;

		const success = await deleteUser(userToDelete.id);
		if (success) {
			showNotification('User deleted successfully', 'success');
			loadUsers();
		} else {
			showNotification('Error deleting user', 'error');
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
		return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const totalPages = Math.ceil(totalUsers / usersPerPage);

	const { state } = useSidebar();
	const width = state === 'expanded'
		? 'calc(100vw - var(--sidebar-width) - 50px)'
		: 'calc(100vw - 50px)';

	return (
		<div>
			<div className="flex justify-between items-center mb-8">
				<h2 className="text-2xl font-medium text-white">Users</h2>
				<Button
					onClick={() => setShowCreateModal(true)}
				>
					+ Create User
				</Button>
			</div>

			<ScrollArea
				style={{ width }}
				className="rounded-md border"
			>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Verification</TableHead>
							<TableHead>Created</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user) => (
							<TableRow key={user.id}>
								<TableCell>{user.username}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'
										}`}>
										{user.role}
									</span>
								</TableCell>
								<TableCell>
									<span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.email_verified ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
										}`}>
										{user.email_verified ? 'Yes' : 'No'}
									</span>
								</TableCell>
								<TableCell>{formatDate(user.created_at)}</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => openEditModal(user)}
									>
										Edit
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => openDeleteDialog(user)}
										disabled={user.role === 'admin'}
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
			{totalPages > 1 && (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								onClick={() => loadUsers(currentPage - 1)}
								className={currentPage === 1 || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
							>
								<ChevronLeftIcon className="h-4 w-4" />
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
		</div>
	);
}