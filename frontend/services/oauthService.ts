import { ClientInfo, OAuthParams } from '@/types/oauth';

export class OAuthService {
	private static readonly BASE_URL = '/api/v1/oauth';

	static async fetchClientInfo(clientId: string): Promise<ClientInfo> {
		const response = await fetch(`${this.BASE_URL}/client?client_id=${clientId}`);
		if (!response.ok) {
			throw new Error('Failed to retrieve application information');
		}
		return response.json();
	}

	static async sendAuthorizeRequest(
		params: OAuthParams,
		action: 'approve' | 'deny',
		token: string
	): Promise<{ redirect_url?: string }> {
		const response = await fetch(`${this.BASE_URL}/authorize`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				...params,
				action,
			}),
		});

		if (!response.ok) {
			throw new Error('Error processing authorization request');
		}

		return response.json();
	}
}