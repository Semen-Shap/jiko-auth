import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Authorization required' },
                { status: 401 }
            );
        }

        const response = await fetch(`/api/v1/oauth/userinfo`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
            },
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('OAuth userinfo proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}