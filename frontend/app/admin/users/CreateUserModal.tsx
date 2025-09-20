'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userData: {
        username: string;
        email: string;
        password: string;
        role: string;
    }) => Promise<boolean>;
    loading?: boolean;
}

export function CreateUserModal({
    isOpen,
    onClose,
    onSubmit,
    loading = false
}: CreateUserModalProps) {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const success = await onSubmit(form);
        if (success) {
            setForm({
                username: '',
                email: '',
                password: '',
                role: 'user'
            });
            onClose();
        }
    };

    const handleClose = () => {
        setForm({
            username: '',
            email: '',
            password: '',
            role: 'user'
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-white">Создать пользователя</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Заполните информацию о новом пользователе
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right text-gray-300">
                                Имя пользователя
                            </Label>
                            <Input
                                id="username"
                                value={form.username}
                                onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right text-gray-300">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right text-gray-300">
                                Пароль
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right text-gray-300">
                                Роль
                            </Label>
                            <Select
                                value={form.role}
                                onValueChange={(value: string) => setForm(prev => ({ ...prev, role: value }))}
                            >
                                <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                    <SelectItem value="user" className="text-white hover:bg-gray-700">
                                        Пользователь
                                    </SelectItem>
                                    <SelectItem value="admin" className="text-white hover:bg-gray-700">
                                        Администратор
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? 'Создание...' : 'Создать'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}