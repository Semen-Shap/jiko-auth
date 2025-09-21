import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Собрать query params для backend
        const params = new URLSearchParams();
        for (const [key, value] of searchParams) {
            params.append(key, value);
        }

        const backendUrl = `/api/v1/oauth/authorize?${params.toString()}`;

        return NextResponse.redirect(backendUrl);
    } catch (error) {
        console.error('OAuth authorize proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}