import rss from '@astrojs/rss';
import { api } from '../lib/api';
import type { Article } from '../types';

export async function GET(context: any) {
    let items = [];
    try {
        const { data } = await api.get('/api/blog/articles?status=published&limit=100');
        if (data.success) {
            items = data.data.items.map((article: Article) => ({
                title: article.title,
                pubDate: new Date(article.published_at),
                description: article.excerpt,
                link: `/posts/${article.slug}/`,
                content: article.content, // Optional: include full content
            }));
        }
    } catch (e) {
        console.error('Failed to generate RSS', e);
    }

    return rss({
        title: 'Thinking in Code',
        description: 'Exploring the intersection of technology, design, and life.',
        site: context.site,
        items: items,
        customData: `<language>zh-cn</language>`,
    });
}
