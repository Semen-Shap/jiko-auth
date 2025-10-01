"use client";

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useOAuth } from '@/hooks/use-oauth';

export default function AuthorizePage() {
	const router = useRouter();
	const { data: session } = useSession();
	const user = session?.user;

	const { clientInfo, loading, error, submitting, oauthParams, handleAuthorize } = useOAuth();

	if (loading) return null;

	if (error) {
		return (
			<div className="h-full flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="flex items-center">
							<XCircle className="h-5 w-5 text-destructive mr-2" />
							Authorization Error
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Alert>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					</CardContent>
					<CardFooter>
						<Button
							variant="outline"
							onClick={() => router.push('/')}
							className="w-full"
						>
							Return to Home
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center">
						<Shield className="h-5 w-5 mr-2" />
						Access Request
					</CardTitle>
					<CardDescription>
						The application is requesting access to your account
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
						<h3 className="font-medium text-blue-900 dark:text-blue-100">
							{clientInfo?.name}
						</h3>
						<p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
							Wants to access your profile
						</p>
					</div>

					<div className="space-y-2">
						<p className="text-sm font-medium">Requested permissions:</p>
						<div className="flex items-center space-x-2">
							<CheckCircle className="h-4 w-4 text-green-500" />
							<span className="text-sm">Access to basic profile information</span>
						</div>
						{oauthParams.scope && oauthParams.scope !== 'read' && (
							<div className="flex items-center space-x-2">
								<CheckCircle className="h-4 w-4 text-green-500" />
								<span className="text-sm">Additional permissions: {oauthParams.scope}</span>
							</div>
						)}
					</div>

					<div className="text-sm text-gray-600 dark:text-gray-400">
						<p>Logged in as: <span className="font-medium">{user?.name}</span></p>
					</div>
				</CardContent>

				<CardFooter className="flex space-x-2">
					<Button
						variant="outline"
						onClick={() => handleAuthorize('deny')}
						disabled={submitting}
						className="flex-1"
					>
						{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
						Deny
					</Button>
					<Button
						onClick={() => handleAuthorize('approve')}
						disabled={submitting}
						className="flex-1"
					>
						{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
						Allow Access
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}