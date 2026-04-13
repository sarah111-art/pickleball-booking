const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token');
    
    // Log token for debugging (remove in production)
    if (!token) {
      console.warn('⚠️ No access token found in localStorage');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || data?.error;

    const isAuthLoginEndpoint = endpoint === '/auth/login';

    // Handle 401 Unauthorized
    if (res.status === 401) {
      // Do not force redirect on login call; return readable error for UI.
      if (isAuthLoginEndpoint) {
        return { error: message || 'Email hoặc mật khẩu không đúng' };
      }

      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return { error: message || 'Unauthorized - redirecting to login' };
    }

    if (!res.ok) {
      return { error: message || `Error: ${res.status}` };
    }

    return { data };
  } catch (err) {
    return { error: 'Không thể kết nối đến server' };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
