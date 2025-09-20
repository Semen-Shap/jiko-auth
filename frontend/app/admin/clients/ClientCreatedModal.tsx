'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyIcon, CheckIcon } from 'lucide-react';

interface ClientCreatedModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: { id: string; secret: string } | null;
}

export function ClientCreatedModal({ isOpen, onClose, client }: ClientCreatedModalProps) {
    const [copiedId, setCopiedId] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    const copyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Сбросить статус через 2 секунды
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy. Copy manually.');
        }
    };

    if (!client) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Client Created Successfully</DialogTitle>
                    <DialogDescription>
                        Save the secret key — it will not be shown again! It is recommended to save it in a secure place.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className='space-y-2'>
                        <Label htmlFor="client-id">Client ID</Label>
                        <div className="flex items-center space-x-2">
                            <Input id="client-id" value={client.id} readOnly className="flex-1" />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(client.id, setCopiedId)}
                            >
                                {copiedId ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor="client-secret">Secret Key</Label>
                        <div className="flex items-center space-x-2">
                            <Input id="client-secret" value={client.secret} readOnly className="flex-1" />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(client.secret, setCopiedSecret)}
                            >
                                {copiedSecret ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}