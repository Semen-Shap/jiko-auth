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

        const { searchParams } = new URL(request.url);
        const params = new URLSearchParams();
        for (const [key, value] of searchParams) {
            params.append(key, value);
        }

        const response = await fetch(`/api/v1/admin/users?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
            },
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Admin users proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Authorization required' },
                { status: 401 }
            );
        }

        const body = await request.json();

        const response = await fetch(`/api/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Admin create user proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}