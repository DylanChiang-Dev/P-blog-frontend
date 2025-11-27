import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = '確定',
    cancelText = '取消',
    onConfirm,
    onCancel,
    isDestructive = false
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-white/10 transform transition-all scale-100">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors shadow-lg ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                                : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
