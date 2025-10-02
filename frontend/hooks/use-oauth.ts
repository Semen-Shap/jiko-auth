import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isClientApproved, updateClientApproval } from '@/lib/cookies';
import { OAuthService } from '@/services/oauthService';
import { ClientInfo, OAuthParams, OAuthState, OAuthActions } from '@/types/oauth';

export function useOAuth(): OAuthState & OAuthActions & {
	oauthParams: OAuthParams;
	isValidParams: boolean;
} {
	const searchParams = useSearchParams();
	const { data: session, status } = useSession();
	const token = session?.accessToken;

	// Utility functions
	const extractOAuthParams = useCallback((params: URLSearchParams): OAuthParams => {
		return Object.fromEntries(params.entries());
	}, []);

	const validateOAuthParams = useCallback((params: OAuthParams): boolean => {
		return !!(params.client_id && params.redirect_uri && params.response_type);
	}, []);

	// Memoized values
	const oauthParams = useMemo(() => extractOAuthParams(searchParams), [searchParams, extractOAuthParams]);
	const isValidParams = useMemo(() => validateOAuthParams(oauthParams), [oauthParams, validateOAuthParams]);

	// Check if client is already approved (synchronously)
	const isAlreadyApproved = useMemo(() => {
		if (!oauthParams.client_id || !session?.user?.id) return false;
		return isClientApproved(session.user.id, oauthParams.client_id);
	}, [oauthParams.client_id, session?.user?.id]);

	// State
	const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isAutoApproving, setIsAutoApproving] = useState(false);

	// Utility functions
	const updateClientApprovalCookie = useCallback((clientId: string) => {
		if (!session?.user?.id) return;
		updateClientApproval(session.user.id, clientId);
	}, [session?.user?.id]);

	// API functions
	const fetchClientInfo = useCallback(async () => {
		if (!oauthParams.client_id) return;
		const data = await OAuthService.fetchClientInfo(oauthParams.client_id);
		setClientInfo(data);
	}, [oauthParams.client_id]);

	const sendAuthorizeRequest = useCallback(async (action: 'approve' | 'deny', updateCookies: boolean = false) => {
		if (!token) throw new Error('No access token available');

		const data = await OAuthService.sendAuthorizeRequest(oauthParams, action, token);

		if (data.redirect_url) {
			if (updateCookies && action === 'approve') {
				updateClientApprovalCookie(oauthParams.client_id!);
			}
			window.location.href = data.redirect_url;
			return true;
		}
		return false;
	}, [oauthParams, token, updateClientApprovalCookie]);

	// Auto-approval logic
	const attemptAutoApprove = useCallback(async () => {
		if (!oauthParams.client_id || !token || !isAlreadyApproved) {
			return false;
		}

		setIsAutoApproving(true);
		console.log('Auto-approving from cookies');
		try {
			const success = await sendAuthorizeRequest('approve');
			if (success) return true;
		} catch {
			// If auto-approval fails, fall back to manual approval
		}
		setIsAutoApproving(false);
		return false;
	}, [oauthParams.client_id, token, isAlreadyApproved, sendAuthorizeRequest]);

	// Initialization effect
	useEffect(() => {
		if (!isValidParams || status === 'loading') {
			if (!isValidParams) {
				setError('Invalid OAuth request parameters');
				setLoading(false);
			}
			return;
		}

		const initialize = async () => {
			const autoApproved = await attemptAutoApprove();
			if (!autoApproved) {
				await fetchClientInfo();
				setLoading(false);
			}
		};

		initialize().catch((err) => {
			setError(err instanceof Error ? err.message : 'An error occurred');
			setLoading(false);
		});
	}, [isValidParams, status, attemptAutoApprove, fetchClientInfo]);

	// Authorization handler
	const handleAuthorize = useCallback(async (action: 'approve' | 'deny') => {
		setError(null);
		await sendAuthorizeRequest(action, true);
	}, [sendAuthorizeRequest]);

	return {
		clientInfo,
		loading,
		error,
		oauthParams,
		isValidParams,
		handleAuthorize,
		isAutoApproving,
	};
}