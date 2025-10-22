import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { mainnet } from 'viem/chains';

const PROMISE_CONTRACT = (process.env.PROMISE_CONTRACT || '') as Address;
const PROMISE_TOKEN_ID = BigInt(process.env.PROMISE_TOKEN_ID || '0');
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const INFURA_KEY = process.env.INFURA_KEY || '';

// ERC-1155 balanceOf ABI
const ERC1155_ABI = [
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

  if (!PROMISE_CONTRACT || !PROMISE_TOKEN_ID) {
    console.error('❌ [API /api/holds] Missing PROMISE_CONTRACT or PROMISE_TOKEN_ID in env');
    return NextResponse.json(
      { error: 'Server misconfigured: missing Promise contract or token ID' },
      { status: 500 }
    );
  }

  try {
    // Create viem client with Alchemy v2 endpoint
    const transport = ALCHEMY_KEY
      ? http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`)
      : INFURA_KEY
      ? http(`https://mainnet.infura.io/v3/${INFURA_KEY}`)
      : http(); // fallback to public RPC

    const client = createPublicClient({
      chain: mainnet,
      transport,
    });

    console.log('📡 [API /api/holds] Reading balance from contract...');

    const balance = await client.readContract({
      address: PROMISE_CONTRACT,
      abi: ERC1155_ABI,
      functionName: 'balanceOf',
      args: [owner, PROMISE_TOKEN_ID],
    });

    const holds = balance > 0n;

    console.log('✅ [API /api/holds] Balance read successful', {
      owner,
      balance: balance.toString(),
      holds,
    });

    return NextResponse.json({
      holds,
      balance: balance.toString(),
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

