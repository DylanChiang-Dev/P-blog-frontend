import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $auth, checkAuth } from '../stores/auth';

interface EditArticleButtonProps {
    articleId: string | number;
}

export default function EditArticleButton({ articleId }: EditArticleButtonProps) {
    const auth = useStore($auth);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Ensure auth is checked on mount if not already done
        if (!auth.isAuthenticated && !auth.loading) {
            checkAuth();
        }
    }, []);

    // Don't render anything during SSR or before mount to avoid hydration mismatch
    if (!mounted) return null;

    if (!auth.isAuthenticated) return null;

    return (
        <a
            href={`/admin/edit/${articleId}`}
            className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            編輯
        </a>
    );
}
