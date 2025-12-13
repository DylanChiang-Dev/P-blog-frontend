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
