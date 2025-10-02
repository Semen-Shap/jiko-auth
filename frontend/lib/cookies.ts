/**
 * Utility functions for managing OAuth client approval cookies.
 * Cookies are stored per user with format: approved_clients_{userId}
 * Contains a JSON object: { clientId: approvalTimestamp }
 */

export interface ApprovedClients {
	[clientId: string]: number; // timestamp in ms
}

/**
 * Get approved clients from cookies for a specific user
 */
export function getApprovedClients(userId: string): ApprovedClients {
	const cookieName = `approved_clients_${userId}`;
	const cookieValue = document.cookie
		.split('; ')
		.find(row => row.startsWith(cookieName + '='))
		?.split('=')[1];

	if (!cookieValue) return {};

	try {
		return JSON.parse(decodeURIComponent(cookieValue));
	} catch {
		return {};
	}
}

/**
 * Set approved clients cookie for a specific user
 */
export function setApprovedClients(userId: string, approvedClients: ApprovedClients): void {
	const cookieName = `approved_clients_${userId}`;
	const expires = new Date();
	expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

	document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(approvedClients))}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
}

/**
 * Check if a client is approved and within TTL
 */
export function isClientApproved(userId: string, clientId: string, ttlMs: number = 30 * 24 * 60 * 60 * 1000): boolean {
	const approvedClients = getApprovedClients(userId);
	const approvalTime = approvedClients[clientId];

	if (!approvalTime) return false;

	const now = Date.now();
	return (now - approvalTime) < ttlMs;
}

/**
 * Update approval timestamp for a client
 */
export function updateClientApproval(userId: string, clientId: string): void {
	const approvedClients = getApprovedClients(userId);
	approvedClients[clientId] = Date.now();
	setApprovedClients(userId, approvedClients);
}