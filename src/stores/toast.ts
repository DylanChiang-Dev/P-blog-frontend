import { atom } from 'nanostores';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

export const toasts = atom<ToastMessage[]>([]);

export const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2);
    toasts.set([...toasts.get(), { id, type, message }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
        removeToast(id);
    }, 3000);
};

export const removeToast = (id: string) => {
    toasts.set(toasts.get().filter((t) => t.id !== id));
};

export const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
};
