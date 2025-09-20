'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    user: { id: string; username: string } | null;
    loading?: boolean;
}

export function DeleteUserModal({
    isOpen,
    onClose,
    onConfirm,
    user,
    loading = false
}: DeleteUserModalProps) {
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-white">Удалить пользователя</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Вы уверены, что хотите удалить пользователя "{user?.username}"? Это действие нельзя отменить.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                        Отмена
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading ? 'Удаление...' : 'Удалить'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}