/**
 * IPFS URL utilities
 * Converts ipfs:// protocol URIs to gateway URLs
 */

const IPFS_GATEWAY_URL = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || 'https://propeth.4everland.link/ipfs/';

/**
 * Converts an IPFS URI (ipfs://CID or ipfs://CID/path) to a gateway URL
 * @param ipfsUri - The IPFS URI to convert
 * @returns The gateway URL
 */
export function ipfsToGateway(ipfsUri: string): string {
  if (!ipfsUri) return ipfsUri;

  // Handle ipfs:// protocol
  if (ipfsUri.startsWith('ipfs://')) {
    return ipfsUri.replace('ipfs://', IPFS_GATEWAY_URL);
  }

  // Already a gateway URL, return as-is
  return ipfsUri;
}

/**
 * Converts an IPFS URI to a proxy URL for video content.
 * Uses /api/ipfs/[CID] which proxies through our server to add CORS headers.
 * This is needed because the 4everland gateway doesn't return CORS headers,
 * which causes video elements to fail loading.
 * @param ipfsUri - The IPFS URI to convert
 * @returns The proxy URL
 */
export function ipfsToProxy(ipfsUri: string): string {
  if (!ipfsUri) return ipfsUri;

  // Handle ipfs:// protocol
  if (ipfsUri.startsWith('ipfs://')) {
    const cid = ipfsUri.replace('ipfs://', '');
    return `/api/ipfs/${cid}`;
  }

  // Handle gateway URLs - extract CID and use proxy
  if (ipfsUri.includes('/ipfs/')) {
    const cid = ipfsUri.split('/ipfs/')[1];
    return `/api/ipfs/${cid}`;
  }

  // Unknown format, return as-is
  return ipfsUri;
}
