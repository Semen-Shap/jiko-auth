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
import { Textarea } from '@/components/ui/textarea';

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (clientData: {
        name: string;
        username: string;
        email: string;
        password: string;
        redirect_uris: string[];
    }) => Promise<any>;
    loading?: boolean;
}

export function CreateClientModal({
    isOpen,
    onClose,
    onSubmit,
    loading = false
}: CreateClientModalProps) {
    const [form, setForm] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        redirect_uris: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const clientData = {
            ...form,
            redirect_uris: form.redirect_uris.split('\n')
                .map(uri => uri.trim())
                .filter(uri => uri.length > 0)
        };

        const result = await onSubmit(clientData);
        if (result) {
            setForm({
                name: '',
                username: '',
                email: '',
                password: '',
                redirect_uris: ''
            });
            onClose();
        }
    };

    const handleClose = () => {
        setForm({
            name: '',
            username: '',
            email: '',
            password: '',
            redirect_uris: ''
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-white">Создать OAuth клиента</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Заполните информацию о новом OAuth клиенте
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="client-name" className="text-right text-gray-300">
                                Имя клиента
                            </Label>
                            <Input
                                id="client-name"
                                value={form.name}
                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="client-username" className="text-right text-gray-300">
                                Имя пользователя
                            </Label>
                            <Input
                                id="client-username"
                                value={form.username}
                                onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="client-email" className="text-right text-gray-300">
                                Email
                            </Label>
                            <Input
                                id="client-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="client-password" className="text-right text-gray-300">
                                Пароль
                            </Label>
                            <Input
                                id="client-password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="redirect-uris" className="text-right text-gray-300">
                                Redirect URIs
                            </Label>
                            <Textarea
                                id="redirect-uris"
                                value={form.redirect_uris}
                                onChange={(e) => setForm(prev => ({ ...prev, redirect_uris: e.target.value }))}
                                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                                rows={4}
                                placeholder="https://example.com/callback&#10;https://app.example.com/oauth/callback"
                                required
                            />
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