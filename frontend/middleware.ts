import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
	const token = await getToken({ req: request });
	const isAuth = !!token;
	const isAdmin = token?.role === 'admin';

	if (request.nextUrl.pathname.startsWith('/admin') && (!isAuth || !isAdmin)) {
		return NextResponse.redirect(new URL('/access-denied', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/admin/:path*'],
};