import React, { useState, useEffect } from 'react';
import ArticleManager from './ArticleManager';
import CommentModeration from './CommentModeration';
import MediaManager from './MediaManager';
import ThemeToggle from './ThemeToggle';
import { logout } from '../stores/auth';
import { api } from '../lib/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalArticles: 0,
        totalComments: 0,
        totalViews: 0,
        loading: true
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [publishedRes, draftRes] = await Promise.all([
                api.get('/api/blog/articles?limit=50&status=published'),
                api.get('/api/blog/articles?limit=50&status=draft')
            ]);

            const allArticles = [
                ...(publishedRes.data.success ? publishedRes.data.data.items : []),
                ...(draftRes.data.success ? draftRes.data.data.items : [])
            ];

            const totalViews = allArticles.reduce((sum, article) => sum + (article.view_count || 0), 0);

            // Fetch pending comments count
            let pendingComments = 0;
            try {
                const commentsRes = await api.get('/api/blog/comments/pending');
                if (commentsRes.data.success) {
                    pendingComments = (commentsRes.data.data.items || commentsRes.data.data || []).length;
                }
            } catch (e) {
                console.warn('Failed to fetch comments count');
            }

            setStats({
                totalArticles: allArticles.length,
                totalComments: pendingComments,
                totalViews: totalViews,
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch stats', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    const handleLogout = () => {
        if (confirm('確定要登出嗎？')) {
            logout();
            window.location.href = '/admin/login';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-blue-500/30">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header & Stats */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-gray-200 dark:border-gray-800 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xl">
                            P
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">控制台</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span>文章: {stats.loading ? '...' : stats.totalArticles}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                                <span>待審核留言: {stats.loading ? '...' : stats.totalComments}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                                <span>瀏覽: {stats.loading ? '...' : stats.totalViews}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <a href="/" className="text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                            回首頁
                        </a>
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                        >
                            登出
                        </button>
                    </div>
                </header>

                {/* Main Content Stack */}
                <main className="space-y-16 animate-fade-in">
                    {/* Article Management Section */}
                    <section>
                        <ArticleManager />
                    </section>

                    {/* Comment Management Section */}
                    <section className="pt-8 border-t border-gray-200 dark:border-gray-800">
                        <CommentModeration />
                    </section>

                    {/* Media Management Section */}
                    <section className="pt-8 border-t border-gray-200 dark:border-gray-800">
                        <MediaManager />
                    </section>
                </main>
            </div>
        </div>
    );
}
