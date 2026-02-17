import axios from 'axios';

// Browser: use same-origin `/api/*` (handled by `src/pages/api/[...path].ts`) to avoid CORS in all envs.
// Server: call backend directly.
const BACKEND_ORIGIN = import.meta.env.PUBLIC_API_URL ?? 'https://pyq.3331322.xyz';
const API_URL = typeof window === 'undefined' ? BACKEND_ORIGIN : '';

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => {
        const contentType = String(response.headers?.['content-type'] ?? '');
        if (contentType.includes('text/html')) {
            return Promise.reject(
                new Error('API returned HTML (likely a backend/server error).')
            );
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await axios.post(`${API_URL}/api/token/refresh`, null, {
                    withCredentials: true,
                    headers: { 'Content-Type': 'application/json' },
                });

                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear client state and redirect to login if needed
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('user');
                    } catch {
                        // ignore
                    }

                    if (window.location.pathname.startsWith('/admin')) {
                        window.location.href = '/admin/login';
                    }
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
