import type { APIRoute } from 'astro';

const BACKEND_ORIGIN =
	import.meta.env.PUBLIC_API_URL ?? 'https://pyqapi.3331322.xyz';

const HOP_BY_HOP_HEADERS = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailers',
	'transfer-encoding',
	'upgrade',
]);

function rewriteSetCookieForRequest(cookie: string, host: string, isHttps: boolean) {
	const parts = cookie.split(';').map((part) => part.trim());
	if (parts.length === 0) return cookie;

	const nameValue = parts[0];
	const attributes = parts.slice(1);
	const rewritten: string[] = [nameValue];

	for (const attribute of attributes) {
		if (!attribute) continue;

		const [rawKey, ...rawValueParts] = attribute.split('=');
		const key = rawKey.trim();
		const lowerKey = key.toLowerCase();
		const rawValue = rawValueParts.join('=').trim();

		if (lowerKey === 'domain') {
			const domain = rawValue.replace(/^\./, '').toLowerCase();
			const hostLower = host.toLowerCase();
			const matchesHost =
				hostLower === domain || hostLower.endsWith(`.${domain}`);
			if (matchesHost) rewritten.push(`${key}=${rawValue}`);
			continue;
		}

		if (lowerKey === 'secure') {
			if (isHttps) rewritten.push(key);
			continue;
		}

		if (lowerKey === 'partitioned') {
			if (isHttps) rewritten.push(key);
			continue;
		}

		if (lowerKey === 'samesite') {
			if (!isHttps && rawValue.toLowerCase() === 'none') {
				rewritten.push(`${key}=Lax`);
			} else {
				rewritten.push(`${key}=${rawValue}`);
			}
			continue;
		}

		rewritten.push(rawValueParts.length ? `${key}=${rawValue}` : key);
	}

	return rewritten.join('; ');
}

function filterRequestHeaders(headers: Headers) {
	const filtered = new Headers();
	for (const [key, value] of headers.entries()) {
		const lowerKey = key.toLowerCase();
		if (HOP_BY_HOP_HEADERS.has(lowerKey)) continue;
		if (lowerKey === 'host') continue;
		if (lowerKey === 'content-length') continue;
		if (lowerKey === 'origin') continue;
		if (lowerKey === 'accept-encoding') continue;
		filtered.set(key, value);
	}
	return filtered;
}

function filterResponseHeaders(headers: Headers) {
	const filtered = new Headers();
	for (const [key, value] of headers.entries()) {
		const lowerKey = key.toLowerCase();
		if (HOP_BY_HOP_HEADERS.has(lowerKey)) continue;
		if (lowerKey === 'set-cookie') continue;
		if (lowerKey === 'content-encoding') continue;
		if (lowerKey === 'content-length') continue;
		filtered.set(key, value);
	}
	return filtered;
}

const handler: APIRoute = async ({ request, url }) => {
	const targetUrl = new URL(`${url.pathname}${url.search}`, BACKEND_ORIGIN);

	try {
		const headers = filterRequestHeaders(request.headers);
		headers.set('x-forwarded-host', url.host);
		headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
		headers.set('accept-encoding', 'identity');

		const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
		const body = hasBody ? await request.arrayBuffer() : undefined;

		const upstreamResponse = await fetch(targetUrl, {
			method: request.method,
			headers,
			body,
			redirect: 'manual',
		});

		const upstreamHeaders = filterResponseHeaders(upstreamResponse.headers);
		const setCookies =
			typeof (upstreamResponse.headers as any).getSetCookie === 'function'
				? (upstreamResponse.headers as any).getSetCookie()
				: [];
		const fallbackSetCookie = upstreamResponse.headers.get('set-cookie');
		const allSetCookies: string[] =
			Array.isArray(setCookies) && setCookies.length > 0
				? setCookies
				: fallbackSetCookie
					? [fallbackSetCookie]
					: [];

		const isHttps = url.protocol === 'https:';
		for (const cookie of allSetCookies) {
			upstreamHeaders.append(
				'set-cookie',
				rewriteSetCookieForRequest(cookie, url.hostname, isHttps),
			);
		}
		const upstreamContentType = upstreamResponse.headers.get('content-type') ?? '';

		// Buffer text/JSON responses to avoid any stream+compression issues in dev/proxies.
		if (upstreamContentType.startsWith('text/') || upstreamContentType.includes('application/json')) {
			const responseBody = await upstreamResponse.arrayBuffer();
			return new Response(responseBody, {
				status: upstreamResponse.status,
				statusText: upstreamResponse.statusText,
				headers: upstreamHeaders,
			});
		}

		return new Response(upstreamResponse.body, {
			status: upstreamResponse.status,
			statusText: upstreamResponse.statusText,
			headers: upstreamHeaders,
		});
	} catch {
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Upstream API unavailable',
			}),
			{
				status: 502,
				headers: {
					'content-type': 'application/json; charset=utf-8',
				},
			},
		);
	}
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
