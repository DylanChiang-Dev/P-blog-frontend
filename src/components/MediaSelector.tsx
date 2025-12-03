import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { toast } from '../stores/toast';

interface MediaItem {
    id: number;
    url: string;
    filename: string;
    created_at: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

export default function MediaSelector({ isOpen, onClose, onSelect }: Props) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
        }
    }, [isOpen]);

    const fetchMedia = async () => {
        try {
            const { data } = await api.get('/api/media?limit=50');
            if (data.success) {
                setMedia(data.data.items || data.data);
            }
        } catch (error: any) {
            console.warn('Failed to fetch media:', error.message);
            if (error.response?.status === 404) {
                setMedia([]);
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

        for (let i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]);
        }

        try {
            const { data } = await api.post('/api/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.success && data.data.items) {
                const newImages = data.data.items.map((img: any) => ({
                    id: img.id,
                    url: img.url,
                    filename: img.filename,
                    created_at: img.created_at
                }));
                setMedia([...newImages, ...media]);
                toast.success(`成功上傳 ${newImages.length} 張圖片！`);

                // If only one image uploaded, auto-select it? Maybe not, let user choose.
            }
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('上傳失敗');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl max-h-[80vh] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">選擇圖片</h3>
                    <div className="flex gap-2">
                        <label className={`cursor-pointer px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold hover:opacity-80 transition-all flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {uploading ? '上傳中...' : '上傳新圖片'}
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </label>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-20">載入中...</div>
                    ) : media.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500">
                            暫無圖片，請上傳。
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {media.map(item => (
                                <div
                                    key={item.id}
                                    className="group relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                                    onClick={() => onSelect(item.url)}
                                >
                                    <img
                                        src={item.url}
                                        alt={item.filename}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold transform scale-90 group-hover:scale-100 transition-all">選擇</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
