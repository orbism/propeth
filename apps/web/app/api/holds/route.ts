import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { mainnet, foundry } from 'viem/chains';

const PROMISE_CONTRACT = (process.env.NEXT_PUBLIC_PROMISE_CONTRACT || '') as Address;
const PROMISE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_PROMISE_CHAIN_ID || '1');
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const INFURA_KEY = process.env.INFURA_KEY || '';

console.log('🔧 [API /api/holds] Env loaded', {
  contract: PROMISE_CONTRACT,
  chainId: PROMISE_CHAIN_ID,
});

// ERC-721 balanceOf ABI (for checking any NFT ownership in collection)
const ERC721_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenByIndex',
    inputs: [
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenOfOwnerByIndex',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner') as Address | null;

  console.log('🔍 [API /api/holds] Request received', {
    owner,
    contract: PROMISE_CONTRACT,
    chainId: PROMISE_CHAIN_ID,
    alchemyConfigured: !!ALCHEMY_KEY,
    infuraConfigured: !!INFURA_KEY,
  });

  // Validate inputs
  if (!owner || !/^0x[a-fA-F0-9]{40}$/.test(owner)) {
    return NextResponse.json({ error: 'Invalid or missing owner address' }, { status: 400 });
  }

  // Check if contract is set (tokenId can be 0, which is valid but falsy)
  if (!PROMISE_CONTRACT) {
    console.error('❌ [API /api/holds] Missing PROMISE_CONTRACT in env');
    return NextResponse.json(
      { error: 'Server misconfigured: missing Promise contract' },
      { status: 500 }
    );
  }

  try {
    // Determine chain and transport based on PROMISE_CHAIN_ID
    const chain = PROMISE_CHAIN_ID === 1337 ? foundry : mainnet;
    
    const transport = PROMISE_CHAIN_ID === 1337
      ? http('http://127.0.0.1:8545') // Local Anvil
      : ALCHEMY_KEY
      ? http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`)
      : INFURA_KEY
      ? http(`https://mainnet.infura.io/v3/${INFURA_KEY}`)
      : http(); // fallback to public RPC

    const client = createPublicClient({
      chain,
      transport,
    });

    console.log('📡 [API /api/holds] Checking NFT ownership (ERC721)...');

    // Check if the owner owns any tokens
    let holds = false;
    let ownedTokens: string[] = [];
    try {
      const balance = await client.readContract({
        address: PROMISE_CONTRACT,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [owner],
      });

      holds = balance > BigInt(0);

      console.log('✅ [API /api/holds] Ownership check complete', {
        owner,
        balance: balance.toString(),
        holds,
      });
    } catch (err: any) {
      console.log('⚠️ [API /api/holds] balanceOf failed', err.message);
      holds = false;
    }

    return NextResponse.json({
      holds,
      balance: holds ? '1' : '0',
      ownedTokens: [], // Don't try to enumerate - let frontend handle discovery
      debug: {
        owner,
        contract: PROMISE_CONTRACT,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ [API /api/holds] Error reading balance', {
      error: error.message,
      stack: error.stack,
      owner,
    });

    return NextResponse.json(
      {
        error: 'Failed to check balance',
        message: error.message,
        debug: {
          owner,
          contract: PROMISE_CONTRACT,
        },
      },
      { status: 500 }
    );
  }
}

