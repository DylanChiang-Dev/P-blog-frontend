import type { AstroCookies } from 'astro';

export async function checkServerAuth(cookies: AstroCookies) {
    const token = cookies.get('access_token')?.value;
    const backendOrigin =
        import.meta.env.PUBLIC_API_URL ?? 'https://api.3331322.xyz';

    if (!token) {
        return { authenticated: false, user: null };
    }

    try {
        // Verify token with backend
        const response = await fetch(`${backendOrigin}/api/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                return { authenticated: true, user: data.data };
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }

    return { authenticated: false, user: null };
}
