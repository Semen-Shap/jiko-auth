// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
	interface Session {
		accessToken?: string;
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			role?: string;
			emailVerified?: boolean;
		};
	}

	interface User {
		id: string;
		email: string;
		name: string;
		role: string;
		emailVerified: boolean;
		accessToken: string;
		expiresAt: number;
	}

	interface JWT {
		accessToken?: string;
		role?: string;
		expiresAt?: number;
	}
}