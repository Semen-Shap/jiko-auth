import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
	const token = await getToken({ req: request });
	const isAuth = !!token;
	const isAdmin = token?.role === 'admin';

	const { pathname } = request.nextUrl;

	// Публичные роуты (доступны всем)
	const publicRoutes = ['/', '/sign-in', '/sign-up', '/oauth/authorize', '/error'];
	const isPublicRoute = publicRoutes.includes(pathname)

	// Защита admin роутов: только админы
	if (pathname.startsWith('/admin') && (!isAuth || !isAdmin)) {
		return NextResponse.redirect(new URL('/access-denied', request.url));
	}

	// Защита остальных роутов: только аутентифицированные пользователи
	if (!isPublicRoute && !isAuth) {
		return NextResponse.redirect(new URL('/sign-in', request.url));
	}

	// Перенаправление аутентифицированных пользователей с login/sign-in страниц на welcome
	if ((pathname === '/sign-in' || pathname === '/' || pathname === '/sign-up') && isAuth) {
		return NextResponse.redirect(new URL('/welcome', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],  // Все роуты кроме API и статических файлов
};