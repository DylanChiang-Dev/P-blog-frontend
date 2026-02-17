/**
 * Fixes media URLs that point to the incorrect domain.
 * Replaces 'https://pyqapi.3331322.xyz' with the configured PUBLIC_API_URL or 'https://api.3331322.xyz'.
 */
export function getMediaUrl(url: string | undefined | null): string {
    if (!url) return '';

    // The incorrect domain to replace
    const incorrectDomain = 'https://pyqapi.3331322.xyz';

    // The correct backend origin from env or fallback
    const correctOrigin = import.meta.env.PUBLIC_API_URL ?? 'https://api.3331322.xyz';

    if (url.startsWith(incorrectDomain)) {
        return url.replace(incorrectDomain, correctOrigin);
    }

    // Check for http version as well just in case
    const incorrectHttpDomain = 'http://pyqapi.3331322.xyz';
    if (url.startsWith(incorrectHttpDomain)) {
        return url.replace(incorrectHttpDomain, correctOrigin);
    }

    // Also handle relative paths if they happen to exist (though API seems to return absolute)
    if (url.startsWith('/uploads/')) {
        return `${correctOrigin}${url}`;
    }

    return url;
}
