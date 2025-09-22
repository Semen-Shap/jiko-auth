export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    email_verified: boolean;
    last_login?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Client {
    id: string;
    user_id: string;
    username: string;
    email: string;
    name: string;
    redirect_uris: string[];
    grants: string[];
    scope: string;
    created_at: string;
    updated_at: string;
}