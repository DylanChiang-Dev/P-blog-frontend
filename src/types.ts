export interface User {
    id: number;
    email: string;
    display_name: string;
    avatar_path?: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
}

export interface Article {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    cover_image?: string;
    status: 'draft' | 'published' | 'archived';
    visibility: 'public' | 'private';
    view_count: number;
    published_at: string;
    created_at: string;
    updated_at: string;
    author: User;
    categories: Category[];
    tags: Tag[];
}

export interface Comment {
    id: number;
    content: string;
    author_name: string;
    author_email?: string;
    article_id: number;
    article_title?: string; // Optional, for display in moderation list
    created_at: string;
    status: 'pending' | 'approved' | 'rejected';
}
