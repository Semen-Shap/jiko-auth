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
import { useSession } from 'next-auth/react';

interface CreateClientModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (clientData: {
		name: string;
		redirect_uris: string[];
	}) => Promise<boolean>;
	loading?: boolean;
}

export function CreateClientModal({
	isOpen,
	onClose,
	onSubmit,
	loading = false
}: CreateClientModalProps) {
	const { data: session } = useSession();
	const user = session?.user;
	const [form, setForm] = useState({
		name: '',
		redirect_uris: ''
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!user) {
			console.error('No authenticated user found');
			return;
		}

		const clientData = {
			name: form.name,
			username: user.name,
			email: user.email || '',
			password: '',
			redirect_uris: form.redirect_uris.split('\n')
				.map(uri => uri.trim())
				.filter(uri => uri.length > 0)
		};

		const result = await onSubmit(clientData);
		if (result) {
			setForm({
				name: '',
				redirect_uris: ''
			});
			onClose();
		}
	};

	const handleClose = () => {
		setForm({
			name: '',
			redirect_uris: ''
		});
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create OAuth Client</DialogTitle>
					<DialogDescription>
						Fill in the client information. User data will be taken from your current account.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="client-name" className="text-right">
								Client Name
							</Label>
							<Input
								id="client-name"
								value={form.name}
								onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="redirect-uris" className="text-right">
								Redirect URIs
							</Label>
							<Textarea
								id="redirect-uris"
								value={form.redirect_uris}
								onChange={(e) => setForm(prev => ({ ...prev, redirect_uris: e.target.value }))}
								className="col-span-3"
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
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? 'Creating...' : 'Create'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}