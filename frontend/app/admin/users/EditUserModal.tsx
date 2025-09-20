'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    email_verified: boolean;
    created_at: string;
}

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userData: {
        username: string;
        email: string;
        password?: string;
        role: string;
        email_verified: boolean;
    }) => Promise<boolean>;
    user: User | null;
    loading?: boolean;
}

export function EditUserModal({
    isOpen,
    onClose,
    onSubmit,
    user,
    loading = false
}: EditUserModalProps) {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user',
        email_verified: false
    });

    useEffect(() => {
        if (user) {
            setForm({
                username: user.username,
                email: user.email,
                password: '',
                role: user.role,
                email_verified: user.email_verified
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const userData: any = { ...form };
        if (!userData.password) {
            delete userData.password;
        }

        const success = await onSubmit(userData);
        if (success) {
            onClose();
        }
    };

    const handleClose = () => {
        setForm({
            username: '',
            email: '',
            password: '',
            role: 'user',
            email_verified: false
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-white">Редактировать пользователя</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Измените информацию о пользователе
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-username" className="text-right text-gray-300">
                                Имя пользователя
                            </Label>
                            <Input
                                id="edit-username"
                                value={form.username}
                                onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right text-gray-300">
                                Email
                            </Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-password" className="text-right text-gray-300">
                                Новый пароль
                            </Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                placeholder="Оставьте пустым, чтобы не менять"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-role" className="text-right text-gray-300">
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
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email-verified" className="text-right text-gray-300">
                                Email подтвержден
                            </Label>
                            <div className="col-span-3 flex items-center">
                                <Checkbox
                                    id="edit-email-verified"
                                    checked={form.email_verified}
                                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, email_verified: checked as boolean }))}
                                    className="border-gray-600"
                                />
                            </div>
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
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}