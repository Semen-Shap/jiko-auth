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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Edit user information
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-username" className="text-right">
                                Username
                            </Label>
                            <Input
                                id="edit-username"
                                value={form.username}
                                onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-password" className="text-right">
                                New Password
                            </Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                                className="col-span-3"
                                placeholder="Leave blank to keep unchanged"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-role" className="text-right">
                                Role
                            </Label>
                            <Select
                                value={form.role}
                                onValueChange={(value: string) => setForm(prev => ({ ...prev, role: value }))}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">
                                        User
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        Administrator
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email-verified" className="text-right">
                                Email Verified
                            </Label>
                            <div className="col-span-3 flex items-center">
                                <Checkbox
                                    id="edit-email-verified"
                                    checked={form.email_verified}
                                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, email_verified: checked as boolean }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}