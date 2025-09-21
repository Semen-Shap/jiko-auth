import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();

        const response = await fetch(`/api/v1/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('OAuth token proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}