export interface ClientInfo {
	client_id: string;
	name: string;
	created_at: string;
}

export interface OAuthParams {
	client_id?: string;
	redirect_uri?: string;
	response_type?: string;
	[key: string]: string | undefined;
}

export interface OAuthState {
	clientInfo: ClientInfo | null;
	loading: boolean;
	error: string | null;
	isAutoApproving: boolean;
}

export interface OAuthActions {
	handleAuthorize: (action: 'approve' | 'deny') => Promise<void>;
}