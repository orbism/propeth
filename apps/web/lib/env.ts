// Centralized environment access for Promise NFT config.
// Only use NEXT_PUBLIC_* so the behavior is explicit and client-safe.
import { debug } from './debug';

const RAW_CONTRACT = (process.env.NEXT_PUBLIC_PROMISE_CONTRACT ?? '').trim();
const RAW_TOKEN_ID = (process.env.NEXT_PUBLIC_PROMISE_TOKEN_ID ?? '').trim();
const RAW_CHAIN_ID = (process.env.NEXT_PUBLIC_PROMISE_CHAIN_ID ?? '').trim();

// Debug logging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  debug.log('🔧 [env.ts] Promise NFT config loaded', {
    contract: RAW_CONTRACT,
    tokenId: RAW_TOKEN_ID,
    chainId: RAW_CHAIN_ID,
    chainIdParsed: RAW_CHAIN_ID ? Number(RAW_CHAIN_ID) : undefined,
  });
}

export const PROMISE_CONTRACT = RAW_CONTRACT as `0x${string}`;
export const PROMISE_TOKEN_ID_STR = RAW_TOKEN_ID;
export const PROMISE_TOKEN_ID = RAW_TOKEN_ID ? BigInt(RAW_TOKEN_ID) : undefined;
export const PROMISE_CHAIN_ID = RAW_CHAIN_ID ? Number(RAW_CHAIN_ID) : undefined;

export const OPENSEA_ITEM_URL = RAW_CONTRACT && RAW_TOKEN_ID
  ? `https://opensea.io/item/ethereum/${PROMISE_CONTRACT}/${PROMISE_TOKEN_ID_STR}`
  : '#';


