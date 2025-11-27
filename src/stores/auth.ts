import { map } from 'nanostores';
// Auth store using nanostores
import { api } from '../lib/api';

export interface User {
    id: number;
    email: string;
    role: string;
    display_name?: string;
    avatar_path?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
}

export const $auth = map<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true, // Start loading to check auth on mount
});

export async function checkAuth() {
    $auth.setKey('loading', true);
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            $auth.set({ isAuthenticated: false, user: null, loading: false });
            return;
        }

        const { data } = await api.get('/api/me');
        if (data.success) {
            $auth.set({
                isAuthenticated: true,
                user: data.data,
                loading: false,
            });
        } else {
            throw new Error('Auth check failed');
        }
    } catch (error) {
        $auth.set({ isAuthenticated: false, user: null, loading: false });
        localStorage.removeItem('access_token');
    }
}

export function logout() {
    api.post('/api/logout').catch(console.error); // Fire and forget
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    $auth.set({ isAuthenticated: false, user: null, loading: false });
    window.location.href = '/';
}
