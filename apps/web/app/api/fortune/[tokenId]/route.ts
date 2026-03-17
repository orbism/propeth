import { createPublicClient, http } from 'viem';
import { mainnet, sepolia, foundry } from 'viem/chains';
import { NextRequest } from 'next/server';
import { FORTUNE721_ABI, FORTUNE721_ADDRESS } from '@/lib/contracts';
import { debug } from '@/lib/debug';

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '1');
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const INFURA_KEY = process.env.INFURA_KEY || '';
const IPFS_GATEWAY = 'https://propeth.4everland.link/ipfs/';

function getChainAndTransport() {
  if (CHAIN_ID === 1337) {
    return { chain: foundry, transport: http('http://127.0.0.1:8545') };
  } else if (CHAIN_ID === 11155111) {
    const transport = INFURA_KEY
      ? http(`https://sepolia.infura.io/v3/${INFURA_KEY}`)
      : ALCHEMY_KEY
      ? http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`)
      : http('https://rpc.sepolia.org');
    return { chain: sepolia, transport };
  } else {
    const transport = INFURA_KEY
      ? http(`https://mainnet.infura.io/v3/${INFURA_KEY}`)
      : ALCHEMY_KEY
      ? http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`)
      : http();
    return { chain: mainnet, transport };
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;

    const { chain, transport } = getChainAndTransport();
    const client = createPublicClient({
      chain,
      transport,
    });

    // Read fortune data (card IDs + variants)
    const fortuneData = await client.readContract({
      address: FORTUNE721_ADDRESS,
      abi: FORTUNE721_ABI,
      functionName: 'fortuneData',
      args: [BigInt(tokenId)],
    }) as [bigint, bigint, bigint, bigint, bigint, bigint];

    const [card1, card2, card3, variant1, variant2, variant3] = fortuneData;

    // Read fragment texts, baseBgCID, and fontURI in parallel
    const [text1, text2, text3, baseBgCID, fontURI] = await Promise.all([
      client.readContract({
        address: FORTUNE721_ADDRESS,
        abi: FORTUNE721_ABI,
        functionName: 'fragmentTexts',
        args: [card1, BigInt(1), variant1],
      }) as Promise<string>,
      client.readContract({
        address: FORTUNE721_ADDRESS,
        abi: FORTUNE721_ABI,
        functionName: 'fragmentTexts',
        args: [card2, BigInt(2), variant2],
      }) as Promise<string>,
      client.readContract({
        address: FORTUNE721_ADDRESS,
        abi: FORTUNE721_ABI,
        functionName: 'fragmentTexts',
        args: [card3, BigInt(3), variant3],
      }) as Promise<string>,
      client.readContract({
        address: FORTUNE721_ADDRESS,
        abi: FORTUNE721_ABI,
        functionName: 'baseBgCID',
      }) as Promise<string>,
      client.readContract({
        address: FORTUNE721_ADDRESS,
        abi: FORTUNE721_ABI,
        functionName: 'fontURI',
      }) as Promise<string>,
    ]);

    // Build SVG
    const fontFamily = fontURI ? 'Custom' : 'monospace';
    const fontDef = fontURI
      ? `<defs><style>@font-face{font-family:"Custom";src:url(${escapeXml(fontURI)});}</style></defs>`
      : '';

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet">`
      + fontDef
      + `<image href="${IPFS_GATEWAY}${baseBgCID}" width="1920" height="1080"/>`
      + `<text x="960" y="430" text-anchor="middle" fill="#000" font-size="48" font-family="${fontFamily}">${escapeXml(text1)}</text>`
      + `<text x="960" y="580" text-anchor="middle" fill="#000" font-size="48" font-family="${fontFamily}">${escapeXml(text2)}</text>`
      + `<text x="960" y="730" text-anchor="middle" fill="#000" font-size="48" font-family="${fontFamily}">${escapeXml(text3)}</text>`
      + `</svg>`;

    return Response.json({ svg: svgString });
  } catch (error) {
    debug.error('[API] Error fetching fortune SVG:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch fortune SVG' },
      { status: 500 }
    );
  }
}
