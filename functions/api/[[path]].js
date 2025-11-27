// Cloudflare Pages Function - API Proxy
// This proxies all /api/* requests to the backend, bypassing CORS issues

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Extract the API path
    const apiPath = url.pathname.replace('/api/', '');

    // Construct backend URL
    const backendUrl = `https://pyqapi.3331322.xyz/api/${apiPath}${url.search}`;

    // Forward the request to backend
    const backendRequest = new Request(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
    });

    // Get response from backend
    const backendResponse = await fetch(backendRequest);

    // Create new response with CORS headers
    const response = new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: backendResponse.headers,
    });

    // Add CORS headers to ALL responses (including errors)
    response.headers.set('Access-Control-Allow-Origin', url.origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    return response;
}
