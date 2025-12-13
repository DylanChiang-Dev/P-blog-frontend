import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from '../stores/toast';
import ThemeToggle from './ThemeToggle';
import MediaSelector from './MediaSelector';
import ConfirmDialog from './ConfirmDialog';
import type { Article } from '../types';
import { checkAuth, $auth } from '../stores/auth';

interface Props {
    id?: string;
}

export default function ArticleEditor({ id }: Props) {
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [article, setArticle] = useState<Partial<Article>>({
        title: '',
        content: '',
        excerpt: '',
        status: 'draft',
        visibility: 'public',

    });


    // Check authentication on mount
    useEffect(() => {
        checkAuth().then(() => {
            const auth = $auth.get();
            if (!auth.isAuthenticated) {
                window.location.href = '/admin/login';
            }
        });
    }, []);

    useEffect(() => {
        if (id) {
            fetchArticle();
        }
    }, [id]);

    const fetchArticle = async () => {
        try {
            // Fetch article by ID using the backend endpoint
            const { data } = await api.get(`/api/blog/articles/${id}`);
            if (data.success) {
                const fetchedArticle = data.data;
                setArticle(fetchedArticle);
            }
        } catch (error: any) {
            console.error('[ArticleEditor] Failed to fetch article', error);

            // Better error messages
            if (error.response?.status === 404) {
                toast.error('找不到此文章（可能已被刪除），將返回文章列表');
                setTimeout(() => window.location.href = '/admin', 2000);
            } else if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
                toast.error('網絡錯誤或 CORS 問題，請聯繫後端開發者修復 CORS 配置');
            } else {
                toast.error(`無法載入文章：${error.response?.data?.message || error.message}`);
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
            toast.error('Image upload failed');
        }
    };

    const [showTableModal, setShowTableModal] = useState(false);
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [selectingCover, setSelectingCover] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [droppedFiles, setDroppedFiles] = useState<File[] | null>(null);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);

    // Store selection range to persist across modal interactions
    const selectionRef = React.useRef({ start: 0, end: 0 });

    const insertTable = () => {
        const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        let tableMd = '\n';

        // Header row
        tableMd += '| ' + Array(tableCols).fill('標題').join(' | ') + ' |\n';

        // Separator row
        tableMd += '| ' + Array(tableCols).fill('---').join(' | ') + ' |\n';

        // Data rows
        for (let i = 0; i < tableRows; i++) {
            tableMd += '| ' + Array(tableCols).fill('內容').join(' | ') + ' |\n';
        }
        tableMd += '\n';

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const newText = text.substring(0, start) + tableMd + text.substring(end);

        setArticle({ ...article, content: newText });
        setShowTableModal(false);

        // Restore focus
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + tableMd.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertMarkdown = (action: string) => {
        const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let newText = '';
        let newCursorPos = 0;

        switch (action) {
            case '**': // Bold
                newText = text.substring(0, start) + `**${selectedText || '粗體文字'}**` + text.substring(end);
                newCursorPos = end + 4; // Move after closing **
                if (!selectedText) newCursorPos = start + 2; // Move inside **
                break;
            case '*': // Italic
                newText = text.substring(0, start) + `*${selectedText || '斜體文字'}*` + text.substring(end);
                newCursorPos = end + 2;
                if (!selectedText) newCursorPos = start + 1;
                break;
            case 'link':
                newText = text.substring(0, start) + `[${selectedText || '連結文字'}](url)` + text.substring(end);
                newCursorPos = start + (selectedText ? selectedText.length + 3 : 6); // Select 'url' or move to it
                break;
            case 'image':
                // Save current selection before opening modal
                selectionRef.current = { start, end };
                setShowMediaSelector(true);
                return; // Return early to avoid setting content to empty string
            case 'code':
                newText = text.substring(0, start) + `\`\`\`\n${selectedText || '程式碼'}\n\`\`\`` + text.substring(end);
                newCursorPos = start + 4;
                break;
            default: // Headings, Lists, Quote (Prefixes)
                const before = text.substring(0, start);
                // Check if we are at the start of a line, if not add newline
                const prefix = (before.endsWith('\n') || start === 0) ? '' : '\n';
                newText = before + prefix + action + selectedText + text.substring(end);
                newCursorPos = start + prefix.length + action.length + selectedText.length;
                break;
        }

        setArticle(prev => ({ ...prev, content: newText }));

        // Restore focus and cursor
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleMediaSelect = (url: string) => {
        if (selectingCover) {
            setArticle(prev => ({ ...prev, cover_image: url }));
            setShowMediaSelector(false);
            setSelectingCover(false);
            return;
        }

        const { start, end } = selectionRef.current;
        const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
        const savedScrollTop = textarea ? textarea.scrollTop : 0;

        setArticle(prev => {
            const content = prev.content || '';
            const selectedText = content.substring(start, end);
            const newText = content.substring(0, start) + `![${selectedText || '圖片描述'}](${url})` + content.substring(end);
            return { ...prev, content: newText };
        });

        setShowMediaSelector(false);

        // Restore focus and cursor after render
        setTimeout(() => {
            const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
            if (textarea) {
                textarea.focus();
                // Calculate new cursor position based on inserted text length
                // ![text](url) -> 2 + text + 2 + url + 1 = 5 + text + url
                // If text is empty, we use '圖片描述' (4 chars) -> 2 + 4 + 2 + url + 1 = 9 + url

                // We need to know what text was actually inserted.
                // Since we can't easily access the 'prev' state here without another read,
                // we can re-calculate based on what we know.
                // Or better, we can read the current value from textarea since it should be updated by now (in setTimeout).

                // Let's use the same logic as inside setArticle for consistency.
                // We assume the content at 'start' was what we expected.

                // Wait, we can't know if 'selectedText' was empty or not easily without reading content again.
                // But we have 'start' and 'end' from ref.
                const selectionLen = end - start;
                const insertedTextLen = selectionLen > 0 ? selectionLen : 4; // '圖片描述' is 4 chars

                // Length of inserted markdown: `![` (2) + text (len) + `](` (2) + url (len) + `)` (1)
                // Total length = 5 + insertedTextLen + url.length;
                const markdownLen = 5 + insertedTextLen + url.length;

                const newCursorPos = start + markdownLen;
                textarea.setSelectionRange(newCursorPos, newCursorPos);

                // Restore scroll position to prevent jumping to bottom
                textarea.scrollTop = savedScrollTop;
            }
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            // Check if they are images
            const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
            if (imageFiles.length > 0) {
                setDroppedFiles(imageFiles);
            }
        }
    };

    const confirmDropUpload = async () => {
        if (!droppedFiles || droppedFiles.length === 0) return;

        const formData = new FormData();
        // droppedFiles is already filtered in handleDrop, but safe to check again or just use it
        const imageFiles = droppedFiles;

        for (const file of imageFiles) {
            formData.append('files[]', file);
        }

        try {
            const { data } = await api.post('/api/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.success && data.data.items) {
                const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
                // Use textarea.value to get the most current content, avoiding stale closure issues
                let currentContent = textarea ? textarea.value : (article.content || '');
                console.log('[ArticleEditor] confirmDropUpload - Textarea found:', !!textarea);
                console.log('[ArticleEditor] confirmDropUpload - Current content length:', currentContent.length);

                let insertPos = textarea ? textarea.selectionStart : currentContent.length;

                // Insert all uploaded images
                let insertedContent = '';
                data.data.items.forEach((img: any) => {
                    insertedContent += `\n![${img.filename}](${img.url})\n`;
                });

                let newText = '';
                if (textarea) {
                    newText = currentContent.substring(0, insertPos) + insertedContent + currentContent.substring(insertPos);
                } else {
                    newText = currentContent + insertedContent;
                }
                console.log('[ArticleEditor] confirmDropUpload - New text length:', newText.length);

                setArticle(prev => ({ ...prev, content: newText }));
                toast.success(`成功上傳 ${data.data.items.length} 張圖片！`);

                // Restore cursor position
                if (textarea) {
                    setTimeout(() => {
                        textarea.focus();
                        const newCursorPos = insertPos + insertedContent.length;
                        textarea.setSelectionRange(newCursorPos, newCursorPos);
                    }, 0);
                }
            } else {
                // Handle case where success is true but no items (shouldn't happen if backend is good)
                if (data.data.items && data.data.items.length === 0) {
                    toast.error('上傳成功但未返回圖片數據');
                }
            }
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('上傳失敗');
        } finally {
            setDroppedFiles(null);
        }
    };

    const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();

        if (!article.title?.trim()) {
            toast.error('請輸入文章標題');
            return;
        }

        if (!article.content?.trim()) {
            toast.error('請輸入文章內容');
            return;
        }

        console.log('[ArticleEditor] handleSubmit called');
        console.log('[ArticleEditor] Article state:', article);
        setSaving(true);

        try {
            const payload = {
                ...article
            };

            // Explicitly set published_at if publishing for the first time
            if (payload.status === 'published' && !payload.published_at) {
                // Format as YYYY-MM-DD HH:mm:ss for MySQL compatibility
                const now = new Date();
                const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
                payload.published_at = formatted;
            }

            console.log('[ArticleEditor] Sending payload:', payload);

            let response;
            if (article.id) {
                response = await api.put(`/api/blog/articles/${article.id}`, payload);
            } else {
                response = await api.post('/api/blog/articles', payload);
            }

            console.log('[ArticleEditor] Save response:', response.data);

            // Only redirect if save was successful
            if (response.data.success) {
                console.log('[ArticleEditor] Save successful, redirecting...');
                toast.success('文章已成功發佈！');

                // Check if we came from an article detail page
                const referrer = document.referrer;
                const articleDetailPattern = /\/posts\/\d+/;

                // Delay redirect slightly to see toast
                setTimeout(() => {
                    // Private articles should always go to admin dashboard
                    if (article.visibility === 'private') {
                        window.location.href = '/admin';
                    } else if (referrer && articleDetailPattern.test(referrer)) {
                        // Return to the article detail page (only for public articles)
                        window.location.href = referrer;
                    } else if (article.id) {
                        // If editing existing public article from admin, go to its detail page
                        window.location.href = `/posts/${article.id}`;
                    } else {
                        // Default to admin dashboard
                        window.location.href = '/admin';
                    }
                }, 1000);
            } else {
                throw new Error(response.data.message || 'Save failed');
            }
        } catch (error: any) {
            console.error('[ArticleEditor] Save failed:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save article';
            toast.error(`保存失敗：${errorMessage}`);
            setSaving(false);
        }
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
                    <button
                        onClick={() => {
                            const referrer = document.referrer;
                            const articleDetailPattern = /\/posts\/\d+/;

                            if (referrer && articleDetailPattern.test(referrer)) {
                                window.location.href = referrer;
                            } else {
                                window.location.href = '/admin';
                            }
                        }}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">
                        {id ? '編輯文章' : '撰寫新文章'}
                    </span>
                </div>
                <div className="flex gap-3 items-center">
                    <ThemeToggle />
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
                        <div className="mb-4 flex flex-wrap gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            {[
                                { label: 'B', icon: <span className="font-bold">B</span>, action: '**', title: '粗體' },
                                { label: 'I', icon: <span className="italic">I</span>, action: '*', title: '斜體' },
                                { label: 'H2', icon: 'H2', action: '## ', title: '標題 2' },
                                { label: 'H3', icon: 'H3', action: '### ', title: '標題 3' },
                                { label: 'List', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>, action: '- ', title: '無序列表' },
                                { label: 'Num', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>, action: '1. ', title: '有序列表' },
                                { label: 'Link', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>, action: 'link', title: '連結' },
                                { label: 'Img', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>, action: 'image', title: '圖片' },
                                { label: 'Code', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>, action: 'code', title: '程式碼區塊' },
                                { label: 'Quote', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>, action: '> ', title: '引用' },
                                { label: 'Table', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7-8v8m14-8v8M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>, action: 'table', title: '表格' },
                            ].map((btn) => (
                                <button
                                    key={btn.label}
                                    onClick={() => btn.action === 'table' ? setShowTableModal(true) : insertMarkdown(btn.action)}
                                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors"
                                    title={btn.title}
                                >
                                    {btn.icon}
                                </button>
                            ))}
                        </div>
                        <div
                            className={`relative rounded-2xl transition-all ${dragOver ? 'ring-4 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <textarea
                                id="content-textarea"
                                value={article.content || ''}
                                onChange={e => {
                                    setArticle(prev => ({ ...prev, content: e.target.value }));
                                }}
                                className="w-full h-[calc(100vh-450px)] bg-transparent text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 border-none outline-none resize-none font-mono p-4"
                                placeholder="# 開始您的創作旅程..."
                            />
                            {dragOver && (
                                <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm rounded-2xl pointer-events-none">
                                    <div className="text-blue-500 font-bold text-xl flex items-center gap-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                        釋放以圖片上傳
                                    </div>
                                </div>
                            )}
                        </div>
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

                            {/* Visibility/Privacy Setting */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">隱私權限</label>
                                <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('[Visibility] Clicked Public button');
                                            setArticle({ ...article, visibility: 'public' });
                                            console.log('[Visibility] State updated to public');
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${article.visibility === 'public'
                                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-lg'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        公開
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('[Visibility] Clicked Private button');
                                            setArticle({ ...article, visibility: 'private' });
                                            console.log('[Visibility] State updated to private');
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${article.visibility === 'private'
                                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-lg'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                        </svg>
                                        私密
                                    </button>
                                </div>
                                {article.visibility === 'private' && (
                                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                        </svg>
                                        此文章僅您可見，不會出現在首頁
                                    </p>
                                )}
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
                                        <div
                                            className="absolute inset-0 w-full h-full cursor-pointer"
                                            onClick={() => {
                                                setSelectingCover(true);
                                                setShowMediaSelector(true);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Configuration Modal */}
            {showTableModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">插入表格</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">行數 (Rows)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={tableRows}
                                    onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">列數 (Columns)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={tableCols}
                                    onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowTableModal(false)}
                                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={insertTable}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                            >
                                插入表格
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Media Selector Modal */}
            <MediaSelector
                isOpen={showMediaSelector}
                onClose={() => {
                    setShowMediaSelector(false);
                    setSelectingCover(false);
                }}
                onSelect={handleMediaSelect}
            />

            {/* Drop Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!droppedFiles}
                title="上傳圖片"
                message={`確定要上傳 ${droppedFiles ? droppedFiles.length : 0} 張圖片並插入文章嗎？`}
                confirmText="上傳並插入"
                cancelText="取消"
                onConfirm={confirmDropUpload}
                onCancel={() => setDroppedFiles(null)}
            />
        </div>
    );
}
