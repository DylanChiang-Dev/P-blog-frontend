import React, { useEffect, useState } from 'react';

interface EditArticleButtonProps {
    articleId: string | number;
}

export default function EditArticleButton({ articleId }: EditArticleButtonProps) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check if user has access token in localStorage
        const token = localStorage.getItem('access_token');
        setIsLoggedIn(!!token);
    }, []);

    if (!isLoggedIn) return null;

    return (
        <a
            href={`/admin/editor/${articleId}`}
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
