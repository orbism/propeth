import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { NextRequest } from 'next/server';
import { FORTUNE721_ABI } from '@/lib/contracts';

const FORTUNE721_ADDRESS = process.env.NEXT_PUBLIC_FORTUNE721 as `0x${string}`;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;

    // Create viem client
    const client = createPublicClient({
      transport: http(RPC_URL),
    });

    // Call tokenURI on contract
    const tokenURI = (await client.readContract({
      address: FORTUNE721_ADDRESS,
      abi: FORTUNE721_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    })) as string;

    // Decode base64 data URI
    if (!tokenURI.startsWith('data:application/json;base64,')) {
      return Response.json({ error: 'Invalid token URI format' }, { status: 400 });
    }

    const base64Data = tokenURI.replace('data:application/json;base64,', '');
    const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
    const metadata = JSON.parse(jsonString);

    // Get SVG from image field (which contains base64 SVG)
    const svgDataUri = metadata.image;
    
    if (!svgDataUri || !svgDataUri.startsWith('data:image/svg+xml;base64,')) {
      return Response.json({ error: 'No valid SVG in metadata' }, { status: 400 });
    }

    const svgBase64 = svgDataUri.replace('data:image/svg+xml;base64,', '');
    const svgString = Buffer.from(svgBase64, 'base64').toString('utf-8');

    return Response.json({ svg: svgString });
  } catch (error) {
    console.error('[API] Error fetching fortune SVG:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch fortune SVG' },
      { status: 500 }
    );
  }
}
