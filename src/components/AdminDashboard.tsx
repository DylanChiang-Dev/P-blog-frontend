import React, { useState, useEffect } from 'react';
import ArticleManager from './ArticleManager';
import CommentModeration from './CommentModeration';
import MediaManager from './MediaManager';
import ThemeToggle from './ThemeToggle';
import { logout } from '../stores/auth';
import { api } from '../lib/api';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'articles' | 'comments' | 'media'>('articles');
    const [stats, setStats] = useState({
        totalArticles: 0,
        totalComments: 0,
        totalViews: 0,
        loading: true,
        commentsAuthorized: true,
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch articles with minimal data to get total count from pagination
            // We fetch a larger limit to calculate total views across all articles
            const articlesRes = await api.get('/api/blog/articles?limit=1000');

            let pendingCommentsCount = 0;
            let commentsAuthorized = true;
            try {
                const commentsRes = await api.get('/api/blog/comments/pending');
                pendingCommentsCount = Array.isArray(commentsRes.data?.data)
                    ? commentsRes.data.data.length
                    : Array.isArray(commentsRes.data?.data?.items)
                        ? commentsRes.data.data.items.length
                        : 0;
            } catch (error: any) {
                const status = error?.response?.status;
                if (status === 401 || status === 403) {
                    commentsAuthorized = false;
                } else {
                    throw error;
                }
            }

            const articles = articlesRes.data.data?.items || [];
            // Calculate total views by summing view_count of all articles
            const totalViews = articles.reduce((sum: number, article: any) => sum + (article.view_count || 0), 0);

            setStats({
                totalArticles: articlesRes.data.data?.pagination?.total || 0,
                totalComments: pendingCommentsCount,
                totalViews: totalViews,
                loading: false
                ,
                commentsAuthorized
            });
        } catch (error) {
            console.error('Failed to fetch stats', error);
            setStats(prev => ({ ...prev, loading: false, commentsAuthorized: prev.commentsAuthorized ?? true }));
        }
    };

    const handleLogout = () => {
        console.log('[AdminDashboard] Logout button clicked');
        console.log('[AdminDashboard] Calling logout()...');
        logout();
        console.log('[AdminDashboard] Logout called');
        // logout() function will handle the redirect
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
                                <span>
                                    待審核留言:{' '}
                                    {stats.loading
                                        ? '...'
                                        : stats.commentsAuthorized
                                            ? stats.totalComments
                                            : '無權限'}
                                </span>
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
                <main className="space-y-8 animate-fade-in">
                    {/* Tab Navigation */}
                    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-2">
                        {['articles', 'media', 'comments'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as 'articles' | 'comments' | 'media')}
                                className={`px-6 py-3 font-bold text-sm rounded-t-2xl transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-black dark:bg-white text-white dark:text-black'
                                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                                    }`}
                            >
                                {tab === 'articles' && '📝 文章列表'}
                                {tab === 'media' && '📷 媒體庫'}
                                {tab === 'comments' && '💬 留言管理'}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'articles' && <ArticleManager />}
                    {activeTab === 'media' && <MediaManager />}
                    {activeTab === 'comments' && <CommentModeration />}
                </main>
            </div>
        </div>
    );
}
