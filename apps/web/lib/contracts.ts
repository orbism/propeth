import { Address } from 'viem';

// Contract addresses from env
export const PACK1155_ADDRESS = (process.env.NEXT_PUBLIC_PACK1155 || '') as Address;
export const BURN_GATEWAY_ADDRESS = (process.env.NEXT_PUBLIC_BURN_GATEWAY || '') as Address;
export const FORTUNE721_ADDRESS = (process.env.NEXT_PUBLIC_FORTUNE721 || '') as Address;

// Validate addresses (only in browser)
if (typeof window !== 'undefined') {
  const missingAddresses: string[] = [];
  
  if (!PACK1155_ADDRESS) missingAddresses.push('NEXT_PUBLIC_PACK1155');
  if (!BURN_GATEWAY_ADDRESS) missingAddresses.push('NEXT_PUBLIC_BURN_GATEWAY');
  if (!FORTUNE721_ADDRESS) missingAddresses.push('NEXT_PUBLIC_FORTUNE721');
  
  if (missingAddresses.length > 0) {
    console.error('❌ [Contracts] Missing required environment variables:', missingAddresses);
    console.error('   Please update your .env.local file with deployed contract addresses');
  } else if (process.env.NODE_ENV === 'development') {
    console.log('✅ [Contracts] All addresses loaded', {
      pack: PACK1155_ADDRESS,
      gateway: BURN_GATEWAY_ADDRESS,
      fortune: FORTUNE721_ADDRESS,
    });
  }
}

// Pack1155 ABI (minimal for minting)
export const PACK1155_ABI = [
  {
    type: 'function',
    name: 'mintPack',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [{ name: 'ids', type: 'uint256[3]' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'uri',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pricePerPack',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasMintedPack',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLastThreeCardsMinted',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[3]' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'PackMinted',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'ids', type: 'uint256[3]', indexed: false },
      { name: 'packIndex', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TransferBatch',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'ids', type: 'uint256[]', indexed: false },
      { name: 'values', type: 'uint256[]', indexed: false },
    ],
  },
] as const;

// BurnRedeemGateway ABI
export const BURN_GATEWAY_ABI = [
  {
    type: 'function',
    name: 'burnAndMintPack',
    inputs: [
      { name: 'collection', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'adapters',
    inputs: [{ name: 'collection', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

// Fortune721 ABI
export const FORTUNE721_ABI = [
  {
    type: 'function',
    name: 'mintFromTriptych',
    inputs: [{ name: 'cardIds', type: 'uint256[3]' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'fortuneCreatedFromLastThree',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'lastThreeCardsMinted',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[3]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'fortuneData',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'card1', type: 'uint256' },
      { name: 'card2', type: 'uint256' },
      { name: 'card3', type: 'uint256' },
      { name: 'variant1', type: 'uint256' },
      { name: 'variant2', type: 'uint256' },
      { name: 'variant3', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'FortuneMinted',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'cardIds', type: 'uint256[3]', indexed: false },
      { name: 'variants', type: 'uint256[3]', indexed: false },
    ],
  },
] as const;

// Price from env (fallback to 0.03 ETH)
export const PRICE_PER_PACK = BigInt(
  process.env.NEXT_PUBLIC_PRICE_PER_PACK_WEI || '30000000000000000'
);