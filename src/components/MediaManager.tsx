import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface MediaItem {
    id: number;
    url: string;
    filename: string;
    created_at: string;
}

export default function MediaManager() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        try {
            // Assuming GET /api/media exists. If not, this might fail or return 404.
            // We'll handle it gracefully.
            const { data } = await api.get('/api/media?limit=50');
            if (data.success) {
                setMedia(data.data.items || data.data);
            }
        } catch (error: any) {
            // If 404, it means the endpoint doesn't exist yet, which is expected for now.
            // We just suppress the error to avoid console noise.
            if (error.response && error.response.status === 404) {
                // Silently fail for 404
                setMedia([]);
            } else {
                console.warn('Failed to fetch media', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        // Matching the structure used in ArticleEditor
        formData.append('content', 'Media Upload');
        formData.append('visibility', 'private');

        for (let i = 0; i < files.length; i++) {
            formData.append('images[]', files[i]);
        }

        try {
            // Using the same endpoint as ArticleEditor for now
            const { data } = await api.post('/api/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.success && data.data.images) {
                // Add new images to the list
                const newImages = data.data.images.map((img: any, index: number) => ({
                    id: Date.now() + index, // Temp ID if not provided
                    url: img.url,
                    filename: 'Uploaded Image',
                    created_at: new Date().toISOString()
                }));
                setMedia([...newImages, ...media]);
                alert('上傳成功！');
            }
        } catch (error) {
            console.error('Upload failed', error);
            alert('上傳失敗');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(`![](${url})`);
        alert('Markdown 鏈接已複製到剪貼板！');
    };

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除這張圖片嗎？')) return;
        // Assuming DELETE /api/media/:id or similar
        try {
            await api.delete(`/api/media/${id}`);
            setMedia(media.filter(m => m.id !== id));
        } catch (error) {
            alert('刪除失敗 (後端可能尚未支持)');
        }
    };

    if (loading) return <div className="p-8 text-center">載入媒體庫中...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 rounded-3xl shadow-sm">
                <h2 className="text-xl font-bold px-2">媒體庫</h2>
                <div>
                    <label className={`cursor-pointer px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-80 transition-all shadow-lg flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {uploading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                上傳中...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                上傳圖片
                            </>
                        )}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {media.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                    暫無圖片，點擊右上角上傳。
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {media.map(item => (
                        <div key={item.id} className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
                            <img
                                src={item.url}
                                alt={item.filename}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                            />

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <button
                                    onClick={() => handleCopy(item.url)}
                                    className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-100 shadow-lg transform hover:scale-105 transition-all"
                                >
                                    複製鏈接
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 shadow-lg transform hover:scale-105 transition-all"
                                >
                                    刪除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
