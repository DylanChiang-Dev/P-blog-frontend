import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Article } from '../types';

interface Props {
    id?: string;
}

export default function ArticleEditor({ id }: Props) {
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [article, setArticle] = useState<Partial<Article> & { tag_names?: string[] }>({
        title: '',
        content: '',
        excerpt: '',
        status: 'draft',
        visibility: 'public',
        tag_names: []
    });
    const [tagsInput, setTagsInput] = useState('');

    // Check authentication on mount
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
    }, []);

    useEffect(() => {
        if (id) {
            fetchArticle();
        }
    }, [id]);

    const fetchArticle = async () => {
        try {
            // Use ID instead of slug to avoid URL encoding issues with Chinese characters
            const { data } = await api.get(`/api/blog/articles/${id}`);
            console.log('[ArticleEditor] Fetched article:', data);
            if (data.success) {
                const fetchedArticle = data.data;
                setArticle(fetchedArticle);
                if (fetchedArticle.tags) {
                    setTagsInput(fetchedArticle.tags.map((t: any) => t.name).join(', '));
                }
            }
        } catch (error: any) {
            console.error('[ArticleEditor] Failed to fetch article', error);

            // Better error messages
            if (error.response?.status === 404) {
                alert('找不到此文章（可能已被刪除）\n\n將返回文章列表');
                window.location.href = '/admin';
            } else if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
                alert('網絡錯誤或 CORS 問題\n\n請聯繫後端開發者修復 CORS 配置');
            } else {
                alert(`無法載入文章：${error.response?.data?.message || error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('content', 'Cover Image Upload');
        formData.append('visibility', 'private');
        formData.append('images[]', file);

        try {
            const { data } = await api.post('/api/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.success && data.data.images?.[0]) {
                setArticle(prev => ({ ...prev, cover_image: data.data.images[0].url }));
            }
        } catch (error) {
            console.error('Upload failed', error);
            alert('Image upload failed');
        }
    };

    const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        console.log('[ArticleEditor] handleSubmit called');
        console.log('[ArticleEditor] Article state:', article);
        setSaving(true);

        try {
            const payload = {
                ...article,
                tag_names: tagsInput.split(',').map(t => t.trim()).filter(Boolean)
            };

            console.log('[ArticleEditor] Sending payload:', payload);

            let response;
            if (article.id) {
                console.log('[ArticleEditor] Updating existing article:', article.id);
                response = await api.put(`/api/blog/articles/${article.id}`, payload);
            } else {
                console.log('[ArticleEditor] Creating new article');
                response = await api.post('/api/blog/articles', payload);
            }

            console.log('[ArticleEditor] Save response:', response.data);

            // Only redirect if save was successful
            if (response.data.success) {
                console.log('[ArticleEditor] Save successful, redirecting...');
                window.location.href = '/admin';
            } else {
                throw new Error(response.data.message || 'Save failed');
            }
        } catch (error: any) {
            console.error('[ArticleEditor] Save failed:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save article';
            alert(`保存失敗：${errorMessage}`);
            setSaving(false);
        }
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagsInput(e.target.value);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white"></div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto p-4 lg:p-8 pb-32">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-8 sticky top-4 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4 rounded-full border border-white/20 shadow-lg">
                <div className="flex items-center gap-4">
                    <a href="/admin" className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </a>
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">
                        {id ? '編輯文章' : '撰寫新文章'}
                    </span>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-full hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                儲存中...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                                儲存發佈
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Editor Area */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 shadow-xl min-h-[calc(100vh-200px)]">
                        <input
                            type="text"
                            value={article.title}
                            onChange={e => setArticle({ ...article, title: e.target.value })}
                            className="w-full bg-transparent text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-700 border-none outline-none mb-8"
                            placeholder="輸入文章標題..."
                        />
                        <textarea
                            value={article.content}
                            onChange={e => setArticle({ ...article, content: e.target.value })}
                            className="w-full h-[calc(100vh-400px)] bg-transparent text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 border-none outline-none resize-none font-mono"
                            placeholder="# 開始您的創作旅程..."
                        />
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            發佈設定
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">文章狀態</label>
                                <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
                                    {['draft', 'published', 'archived'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setArticle({ ...article, status: s as any })}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${article.status === s
                                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                                }`}
                                        >
                                            {s === 'draft' && '草稿'}
                                            {s === 'published' && '已發佈'}
                                            {s === 'archived' && '封存'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">標籤</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={tagsInput}
                                        onChange={handleTagsChange}
                                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                                        placeholder="例如: React, 設計, 教學..."
                                    />
                                    <div className="absolute right-3 top-3 text-zinc-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            內容詳情
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">文章摘要</label>
                                <textarea
                                    value={article.excerpt}
                                    onChange={e => setArticle({ ...article, excerpt: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none transition-all resize-none"
                                    placeholder="簡短描述這篇文章的內容..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">封面圖片</label>
                                <div className="relative group cursor-pointer">
                                    <div className={`w-full h-48 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center transition-all overflow-hidden ${article.cover_image ? 'border-transparent' : 'hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                                        }`}>
                                        {article.cover_image ? (
                                            <>
                                                <img src={article.cover_image} alt="Cover" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-medium">更換圖片</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <svg className="w-10 h-10 text-zinc-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                <span className="text-sm text-zinc-500">點擊上傳封面</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
