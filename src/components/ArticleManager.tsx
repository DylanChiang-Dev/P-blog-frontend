import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Article } from '../types';
import ConfirmDialog from './ConfirmDialog';
import { toast } from '../stores/toast';

export default function ArticleManager() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            // Backend now returns articles sorted by published_at DESC
            const response = await api.get('/api/blog/articles?limit=200');

            if (response.data.success) {
                const allArticles = response.data.data.items as Article[];
                // Deduplicate by ID to avoid React key warnings
                const uniqueArticles = Array.from(
                    new Map(allArticles.map((item: Article) => [item.id, item])).values()
                );

                // Custom sorting: Drafts first (sorted by updated_at), then published (sorted by published_at)
                uniqueArticles.sort((a, b) => {
                    // If one is draft and other is not
                    const isDraftA = !a.published_at;
                    const isDraftB = !b.published_at;

                    if (isDraftA && !isDraftB) return -1; // Drafts come first
                    if (!isDraftA && isDraftB) return 1;

                    if (isDraftA && isDraftB) {
                        // Both are drafts: sort by updated_at DESC
                        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
                    }

                    // Both are published: sort by published_at DESC
                    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
                });

                console.log('[ArticleManager] Fetched articles:', uniqueArticles.length);
                setArticles(uniqueArticles);
            }
        } catch (error) {
            console.error('[ArticleManager] Failed to fetch articles', error);
        } finally {
            setLoading(false);
        }
    };

    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        try {
            await api.delete(`/api/blog/articles/${deleteTargetId}`);
            setArticles(articles.filter(a => a.id !== deleteTargetId));
            setDeleteTargetId(null);
        } catch (error) {
            toast.error('刪除文章失敗');
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setDeleteTargetId(id);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">文章管理</h2>
                <a href="/admin/editor" className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:scale-105 transition-transform shadow-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    新增文章
                </a>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {articles.length === 0 ? (
                        <div className="text-center py-20 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/20">
                            <p className="text-gray-500">暫無文章，開始寫作吧！</p>
                        </div>
                    ) : (
                        articles.map((article) => (
                            <div
                                key={article.id}
                                className="group relative bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[1.5rem] p-4 flex items-center gap-6 hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:scale-[1.01] hover:shadow-xl"
                            >
                                {/* Stretched Link for Navigation */}
                                <a
                                    href={`/admin/editor/${article.id}`}
                                    className="absolute inset-0 z-0"
                                    aria-label={`編輯 ${article.title}`}
                                />

                                {/* Status Dot */}
                                <div className={`w-3 h-3 rounded-full shrink-0 ${article.status === 'published' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'
                                    }`}></div>

                                {/* Content Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{article.title}</h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                            {article.view_count}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {article.published_at
                                                ? new Date(article.published_at).toLocaleDateString('zh-TW')
                                                : <span className="text-yellow-600 dark:text-yellow-500">草稿 (未發佈)</span>
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="relative z-10 flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    {/* Preview Button */}
                                    <a
                                        href={`/posts/${article.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                                        title="預覽"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </a>

                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteClick(e, article.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                        title="刪除"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}


            {/* Delete Confirmation Modal */}
            <ConfirmDialog
                isOpen={!!deleteTargetId}
                title="確認刪除"
                message="確定要刪除這篇文章嗎？此操作無法撤銷。"
                confirmText="確認刪除"
                cancelText="取消"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTargetId(null)}
                isDestructive={true}
            />
        </div>
    );
}
