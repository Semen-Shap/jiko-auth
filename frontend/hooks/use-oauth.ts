import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ClientInfo {
	client_id: string;
	name: string;
	created_at: string;
}

interface OAuthParams {
	clientId: string | null;
	redirectUri: string | null;
	responseType: string | null;
	scope: string | null;
	state: string | null;
}

export function useOAuth() {
	const searchParams = useSearchParams();
	const { data: session } = useSession();
	const token = session?.accessToken;

	const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// OAuth parameters - memoize to avoid recalculations
	const oauthParams: OAuthParams = useMemo(() => ({
		clientId: searchParams.get('client_id'),
		redirectUri: searchParams.get('redirect_uri'),
		responseType: searchParams.get('response_type'),
		scope: searchParams.get('scope'),
		state: searchParams.get('state'),
	}), [searchParams]);

	// Validate parameters
	const isValidParams = useMemo(() =>
		oauthParams.clientId && oauthParams.redirectUri && oauthParams.responseType,
		[oauthParams]
	);

	// Fetch client info
	const fetchClientInfo = useCallback(async () => {
		if (!oauthParams.clientId) return;

		try {
			const response = await fetch(`/api/v1/oauth/client?client_id=${oauthParams.clientId}`);
			if (!response.ok) throw new Error('Failed to retrieve application information');
			const data = await response.json();
			setClientInfo(data);
		} catch (err) {
			throw err;
		}
	}, [oauthParams.clientId]);

	// Check if user has refresh token and auto-approve
	const checkAndAutoApprove = useCallback(async () => {
		if (!oauthParams.clientId || !token) return false;

		try {
			const checkResponse = await fetch(`/api/v1/oauth/has_refresh_token?client_id=${oauthParams.clientId}`, {
				headers: { 'Authorization': `Bearer ${token}` },
			});

			if (checkResponse.ok) {
				const checkData = await checkResponse.json();
				if (checkData.has_refresh_token) {
					const approveResponse = await fetch('/api/v1/oauth/authorize', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`,
						},
						body: JSON.stringify({
							client_id: oauthParams.clientId,
							redirect_uri: oauthParams.redirectUri,
							response_type: oauthParams.responseType,
							scope: oauthParams.scope || '',
							state: oauthParams.state || '',
							action: 'approve',
						}),
					});

					if (approveResponse.ok) {
						const approveData = await approveResponse.json();
						if (approveData.redirect_url) {
							window.location.href = approveData.redirect_url;
							return true; // Indicate auto-approval happened
						}
					}
				}
			}
		} catch {
			// Ignore error, continue to show UI
		}
		return false;
	}, [oauthParams, token]);

	// Initialize data fetching
	useEffect(() => {
		if (!isValidParams) {
			setError('Invalid OAuth request parameters');
			setLoading(false);
			return;
		}

		const initialize = async () => {
			try {
				await fetchClientInfo();
				const autoApproved = await checkAndAutoApprove();
				if (!autoApproved) {
					setLoading(false);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
				setLoading(false);
			}
		};

		initialize();
	}, [isValidParams, fetchClientInfo, checkAndAutoApprove]);

	// Handle authorization action
	const handleAuthorize = useCallback(async (action: 'approve' | 'deny') => {
		setSubmitting(true);
		setError(null);

		try {
			const response = await fetch('/api/v1/oauth/authorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({
					client_id: oauthParams.clientId,
					redirect_uri: oauthParams.redirectUri,
					response_type: oauthParams.responseType,
					scope: oauthParams.scope || '',
					state: oauthParams.state || '',
					action,
				}),
			});

			if (!response.ok) throw new Error('Error processing authorization request');

			const data = await response.json();
			if (data.redirect_url) {
				window.location.href = data.redirect_url;
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setSubmitting(false);
		}
	}, [oauthParams, token]);

	return {
		clientInfo,
		loading,
		error,
		submitting,
		oauthParams,
		isValidParams,
		handleAuthorize,
	};
}