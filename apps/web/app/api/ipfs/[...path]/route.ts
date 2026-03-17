/**
 * IPFS Proxy API Route
 * Proxies requests to the 4everland IPFS gateway and adds CORS headers.
 * This is necessary because the gateway doesn't return proper CORS headers,
 * which causes video elements to fail loading.
 */

import { debug } from '@/lib/debug';

const IPFS_GATEWAY_URL = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || 'https://propeth.4everland.link/ipfs/';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const cid = path.join('/');

  // Forward Range header for video streaming
  const headers: HeadersInit = {};
  const range = request.headers.get('Range');
  if (range) {
    headers['Range'] = range;
  }

  try {
    const response = await fetch(`${IPFS_GATEWAY_URL}${cid}`, { headers });

    if (!response.ok) {
      return new Response(`IPFS fetch failed: ${response.statusText}`, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Build response headers
    const responseHeaders: HeadersInit = {
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
    };

    // Forward content type
    const contentType = response.headers.get('Content-Type');
    if (contentType) {
      responseHeaders['Content-Type'] = contentType;
    } else {
      // Default to video/mp4 for video requests
      responseHeaders['Content-Type'] = 'video/mp4';
    }

    // Forward content length
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    // Forward content range for Range requests
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    debug.error('[IPFS Proxy] Error fetching from gateway:', error);
    return new Response('Failed to fetch from IPFS gateway', {
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
    },
  });
}
