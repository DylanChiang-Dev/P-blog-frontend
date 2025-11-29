import React, { useState } from 'react';
import { api } from '../lib/api';
import { $auth } from '../stores/auth';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/api/login', { email, password });

            if (data.success) {
                // Store in localStorage for client-side
                localStorage.setItem('access_token', data.data.access_token);
                localStorage.setItem('user', JSON.stringify(data.data.user));

                // Store in cookie for server-side auth (15 minutes to match token expiry)
                document.cookie = `access_token=${data.data.access_token}; path=/; max-age=${60 * 15}`; // 15 minutes

                $auth.set({
                    isAuthenticated: true,
                    user: data.data.user,
                    loading: false
                });

                window.location.href = '/admin';
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-center mb-8">管理員登入</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">電子郵件</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">密碼</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {loading ? '登入中...' : '登入'}
                </button>
            </form>
        </div>
    );
}
