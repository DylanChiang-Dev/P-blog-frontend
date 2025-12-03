import React from 'react';
import { useStore } from '@nanostores/react';
import { toasts, removeToast } from '../stores/toast';

export default function ToastContainer() {
    const $toasts = useStore(toasts);

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
            {$toasts.map((toast) => (
                <div
                    key={toast.id}
                    onClick={() => removeToast(toast.id)}
                    className={`
                        pointer-events-auto cursor-pointer
                        min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl 
                        transform transition-all duration-300 animate-slide-up
                        flex items-center gap-3 border
                        ${toast.type === 'success'
                            ? 'bg-white dark:bg-zinc-900 border-green-500/20 text-green-600 dark:text-green-400 shadow-green-500/10'
                            : toast.type === 'error'
                                ? 'bg-white dark:bg-zinc-900 border-red-500/20 text-red-600 dark:text-red-400 shadow-red-500/10'
                                : 'bg-white dark:bg-zinc-900 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-blue-500/10'
                        }
                    `}
                >
                    {/* Icon */}
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center shrink-0
                        ${toast.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                            toast.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                                'bg-blue-100 dark:bg-blue-900/30'}
                    `}>
                        {toast.type === 'success' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        )}
                        {toast.type === 'error' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        )}
                        {toast.type === 'info' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        )}
                    </div>

                    {/* Message */}
                    <p className="font-medium text-sm">{toast.message}</p>
                </div>
            ))}
        </div>
    );
}
