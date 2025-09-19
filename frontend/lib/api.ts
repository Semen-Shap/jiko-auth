// lib/api.ts
interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthResponse {
  access_token: string;
  expires_at: number;
  user: User;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface OAuthClient {
  id: string;
  name: string;
  redirect_uris: string[];
  grants: string[];
  scope: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    // В production будет использоваться тот же домен
    // В разработке - proxy на backend
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? '' 
      : '';
  }

  
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('access_token') 
      : null;
    
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      return {
        data: response.ok ? data : undefined,
        error: !response.ok ? (data?.error || `HTTP Error ${response.status}`) : undefined,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // Auth methods
  async register(userData: RegisterRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/api/v1/me');
  }

  async resendVerification(email: string) {
    return this.request('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getUserClients(): Promise<ApiResponse<OAuthClient[]>> {
    return this.request('/api/v1/clients');
  }

  async createToken(clientId: string, scope: string = ""): Promise<ApiResponse<{ token: string }>> {
    return this.request(`/api/v1/clients/${clientId}/tokens`, {
      method: 'POST',
      body: JSON.stringify({ scope }),
    });
  }

  async healthCheck() {
    return this.request('/api/v1/healthcheck');
  }
}

export const apiClient = new ApiClient();
export default apiClient;
