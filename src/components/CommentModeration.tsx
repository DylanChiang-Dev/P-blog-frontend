import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Comment } from '../types';

export default function CommentModeration() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            // Fetch all comments based on filter
            let endpoint = '/api/blog/comments/pending'; // Default to pending

            // API endpoints for different statuses
            // We'll fetch all statuses and filter client-side since we don't know all endpoints
            const { data } = await api.get(endpoint);
            if (data.success) {
                // Backend returns comments without status field, so we add it
                const commentsWithStatus = (data.data.items || data.data || []).map((comment: any) => ({
                    ...comment,
                    status: comment.status || 'pending' // Default to pending if no status
                }));
                setComments(commentsWithStatus);
            }
        } catch (error) {
            console.error('獲取留言失敗', error);
            // Fallback for demo if backend endpoint is missing
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number, status: 'approved' | 'rejected') => {
        try {
            // Use the correct API endpoints from documentation
            if (status === 'approved') {
                await api.post(`/api/blog/comments/${id}/approve`);
            } else {
                await api.post(`/api/blog/comments/${id}/reject`);
            }
            setComments(comments.map(c => c.id === id ? { ...c, status } : c));
        } catch (error) {
            alert('更新狀態失敗');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除這條留言嗎？')) return;
        try {
            await api.delete(`/api/blog/comments/${id}`);
            setComments(comments.filter(c => c.id !== id));
        } catch (error) {
            alert('刪除留言失敗');
        }
    };

    const filteredComments = comments.filter(c => filter === 'all' || c.status === filter);

    if (loading) return <div className="p-8 text-center">載入留言中...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 rounded-3xl shadow-sm">
                <h2 className="text-xl font-bold px-2">留言管理</h2>
                <div className="flex gap-1 bg-gray-100 dark:bg-white/10 p-1 rounded-xl">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f
                                ? 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                }`}
                        >
                            {f === 'pending' ? '待審核' :
                                f === 'approved' ? '已通過' :
                                    f === 'rejected' ? '已拒絕' : '全部'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredComments.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        沒有{filter === 'pending' ? '待審核' : ''}留言
                    </div>
                ) : (
                    filteredComments.map(comment => (
                        <div key={comment.id} className="bg-white/70 dark:bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {comment.author_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 dark:text-white">{comment.author_name}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{comment.author_email}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {new Date(comment.created_at).toLocaleString('zh-TW')}
                                            {comment.article_title && <span className="ml-2">於文章: {comment.article_title}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${comment.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                    comment.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                                    }`}>
                                    {comment.status === 'approved' ? '已通過' :
                                        comment.status === 'rejected' ? '已拒絕' : '待審核'}
                                </div>
                            </div>

                            <div className="pl-13 ml-13">
                                <p className="text-gray-700 dark:text-gray-300 mb-4 bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5">
                                    {comment.content}
                                </p>

                                <div className="flex justify-end gap-3">
                                    {comment.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusChange(comment.id, 'approved')}
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-green-500/30"
                                            >
                                                通過
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(comment.id, 'rejected')}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30"
                                            >
                                                拒絕
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold rounded-xl transition-colors"
                                    >
                                        刪除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
