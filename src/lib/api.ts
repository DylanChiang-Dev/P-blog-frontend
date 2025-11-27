import axios from 'axios';

// Development: Use relative path (Vite proxy)
// Production: Use full URL (will use CF Function proxy in admin pages, direct in public pages)
const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? '' // Relative path for dev proxy
    : 'https://pyqapi.3331322.xyz'; // Full URL for production

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data } = await axios.post(
                    `${API_URL}/api/token/refresh`,
                    {},
                    { withCredentials: true }
                );

                if (data.success && data.data.access_token) {
                    if (typeof window !== 'undefined' && window.localStorage) {
                        localStorage.setItem('access_token', data.data.access_token);
                    }
                    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.access_token}`;
                    originalRequest.headers['Authorization'] = `Bearer ${data.data.access_token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear token and redirect to login if needed
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                    // Only redirect if we are in admin area
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
