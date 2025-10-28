import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { mainnet, foundry } from 'viem/chains';

const PROMISE_CONTRACT = (process.env.NEXT_PUBLIC_PROMISE_CONTRACT || '') as Address;
const PROMISE_TOKEN_ID = BigInt(process.env.NEXT_PUBLIC_PROMISE_TOKEN_ID || '0');
const PROMISE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_PROMISE_CHAIN_ID || '1');
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const INFURA_KEY = process.env.INFURA_KEY || '';

console.log('🔧 [API /api/holds] Env loaded', {
  contract: PROMISE_CONTRACT,
  tokenId: PROMISE_TOKEN_ID.toString(),
  chainId: PROMISE_CHAIN_ID,
});

// ERC-721 ownerOf ABI (for checking single NFT ownership)
const ERC721_ABI = [
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner') as Address | null;

  console.log('🔍 [API /api/holds] Request received', {
    owner,
    contract: PROMISE_CONTRACT,
    tokenId: PROMISE_TOKEN_ID.toString(),
    alchemyConfigured: !!ALCHEMY_KEY,
    infuraConfigured: !!INFURA_KEY,
  });

  // Validate inputs
  if (!owner || !/^0x[a-fA-F0-9]{40}$/.test(owner)) {
    return NextResponse.json({ error: 'Invalid or missing owner address' }, { status: 400 });
  }

  // Check if contract is set (tokenId can be 0, which is valid but falsy)
  if (!PROMISE_CONTRACT || PROMISE_TOKEN_ID === undefined) {
    console.error('❌ [API /api/holds] Missing PROMISE_CONTRACT or PROMISE_TOKEN_ID in env');
    return NextResponse.json(
      { error: 'Server misconfigured: missing Promise contract or token ID' },
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

    // Check if the owner owns this specific token ID
    let holds = false;
    try {
      const tokenOwner = await client.readContract({
        address: PROMISE_CONTRACT,
        abi: ERC721_ABI,
        functionName: 'ownerOf',
        args: [PROMISE_TOKEN_ID],
      });

      holds = tokenOwner.toLowerCase() === owner.toLowerCase();

      console.log('✅ [API /api/holds] Ownership check complete', {
        owner,
        tokenOwner,
        holds,
      });
    } catch (err: any) {
      // If ownerOf throws, token doesn't exist or contract is wrong
      console.log('⚠️ [API /api/holds] ownerOf failed (token may not exist)', err.message);
      holds = false;
    }

    return NextResponse.json({
      holds,
      balance: holds ? '1' : '0',
      debug: {
        owner,
        contract: PROMISE_CONTRACT,
        tokenId: PROMISE_TOKEN_ID.toString(),
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
          tokenId: PROMISE_TOKEN_ID.toString(),
        },
      },
      { status: 500 }
    );
  }
}

