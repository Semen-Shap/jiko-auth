import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		CredentialsProvider({
			name: "credentials",
			credentials: {
				identifier: { label: "Email or Username", type: "text" },
				password: { label: "Password", type: "password" }
			},
			async authorize(credentials) {
				if (!credentials?.identifier || !credentials?.password) {
					return null;
				}

				try {
					const backendUrl = process.env.NODE_ENV === 'production'
						? 'http://backend:8080'
						: 'http://localhost:8080';

					const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							identifier: credentials.identifier,
							password: credentials.password,
						}),
					});

					const data = await res.json();

					if (res.ok && data.access_token) {
						return {
							id: data.user.id,
							email: data.user.email,
							name: data.user.username,
							role: data.user.role,
							emailVerified: data.user.email_verified,
							accessToken: data.access_token,
							expiresAt: data.expires_at,
						};
					}

					return null;
				} catch (error) {
					console.error("Auth error:", error);
					return null;
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.accessToken = user.accessToken;
				token.role = user.role;
				token.emailVerified = user.emailVerified;
				token.expiresAt = user.expiresAt;
			}

			// Check if token is expired
			if (token.expiresAt && Date.now() > (token.expiresAt as number) * 1000) {
				// Token expired, you might want to refresh it here
				// For now, just return null to force re-login
				return null;
			}

			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				session.accessToken = token.accessToken as string;
				session.user.id = token.sub!;
				session.user.role = token.role as string;
				session.user.emailVerified = token.emailVerified as boolean;
				session.expires = new Date((token.expiresAt as number) * 1000).toISOString();
			}
			return session;
		},
	},
	pages: {
		signIn: "/sign-in",
	},
	session: {
		strategy: "jwt",
	},
	secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
});