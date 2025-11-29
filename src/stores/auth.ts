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
    console.log('[Auth] Logout function started');

    api.post('/api/logout').catch(console.error); // Fire and forget
    console.log('[Auth] API logout called');

    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    console.log('[Auth] LocalStorage cleared');

    // Clear cookie
    document.cookie = 'access_token=; path=/; max-age=0';
    console.log('[Auth] Cookie cleared');

    $auth.set({ isAuthenticated: false, user: null, loading: false });
    console.log('[Auth] Auth state updated');

    console.log('[Auth] Redirecting to homepage...');
    window.location.href = '/';
}
