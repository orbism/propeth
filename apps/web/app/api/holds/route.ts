import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { mainnet, sepolia, foundry } from 'viem/chains';

const PROMISE_CONTRACT = (process.env.NEXT_PUBLIC_PROMISE_CONTRACT || '') as Address;
const PROMISE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_PROMISE_CHAIN_ID || '1');
const PROMISE_TOKEN_ID = BigInt(process.env.NEXT_PUBLIC_PROMISE_TOKEN_ID || '1');
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const INFURA_KEY = process.env.INFURA_KEY || '';

console.log('🔧 [API /api/holds] Env loaded', {
  contract: PROMISE_CONTRACT,
  chainId: PROMISE_CHAIN_ID,
  tokenId: PROMISE_TOKEN_ID.toString(),
});

// ERC-1155 balanceOf ABI (requires address AND token ID)
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
    let chain;
    let transport;

    if (PROMISE_CHAIN_ID === 1337) {
      // Local Anvil
      chain = foundry;
      transport = http('http://127.0.0.1:8545');
    } else if (PROMISE_CHAIN_ID === 11155111) {
      // Sepolia testnet
      chain = sepolia;
      transport = INFURA_KEY
        ? http(`https://sepolia.infura.io/v3/${INFURA_KEY}`)
        : ALCHEMY_KEY
        ? http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`)
        : http('https://rpc.sepolia.org');
    } else {
      // Mainnet (default)
      chain = mainnet;
      transport = INFURA_KEY
        ? http(`https://mainnet.infura.io/v3/${INFURA_KEY}`)
        : ALCHEMY_KEY
        ? http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`)
        : http();
    }

    const client = createPublicClient({
      chain,
      transport,
    });

    console.log('📡 [API /api/holds] Checking NFT ownership (ERC1155)...', {
      tokenId: PROMISE_TOKEN_ID.toString(),
    });

    // Check if the owner owns the specific token ID (ERC-1155)
    let holds = false;
    try {
      const balance = await client.readContract({
        address: PROMISE_CONTRACT,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: [owner, PROMISE_TOKEN_ID],
      });

      holds = balance > BigInt(0);

      console.log('✅ [API /api/holds] Ownership check complete', {
        owner,
        tokenId: PROMISE_TOKEN_ID.toString(),
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
      tokenId: PROMISE_TOKEN_ID.toString(),
      debug: {
        owner,
        contract: PROMISE_CONTRACT,
        chainId: PROMISE_CHAIN_ID,
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
          chainId: PROMISE_CHAIN_ID,
          tokenId: PROMISE_TOKEN_ID.toString(),
        },
      },
      { status: 500 }
    );
  }
}

