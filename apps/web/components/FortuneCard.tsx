'use client';

import { useReadContract } from 'wagmi';
import { FORTUNE721_ADDRESS, FORTUNE721_ABI } from '@/lib/contracts';
import { useState, useEffect } from 'react';

interface FortuneCardProps {
  tokenId: bigint;
}

export function FortuneCard({ tokenId }: FortuneCardProps) {
  const [imageData, setImageData] = useState<string>('');
  const [processedSvg, setProcessedSvg] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading fortune...');

  const { data: tokenURI, isLoading } = useReadContract({
    address: FORTUNE721_ADDRESS,
    abi: FORTUNE721_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  });

  useEffect(() => {
    if (tokenURI) {
      try {
        console.log('[FortuneCard] Decoding tokenURI...');
        setLoadingMessage('Decoding fortune data...');
        
        const json = JSON.parse(atob(tokenURI.replace('data:application/json;base64,', '')));
        console.log('[FortuneCard] Decoded metadata:', json);
        
        // Decode the SVG
        const svgBase64 = json.image.replace('data:image/svg+xml;base64,', '');
        const svgText = atob(svgBase64);
        console.log('[FortuneCard] Original SVG:', svgText.slice(0, 200));
        
        // Use dedicated 4everland gateway (already in contract, but ensure it's not replaced)
        const optimizedSvg = svgText
          .replace('https://nftstorage.link/ipfs/', 'https://propeth.4everland.link/ipfs/')
          .replace('https://ipfs.io/ipfs/', 'https://propeth.4everland.link/ipfs/')
          .replace('https://cloudflare-ipfs.com/ipfs/', 'https://propeth.4everland.link/ipfs/');
        
        console.log('[FortuneCard] Optimized SVG:', optimizedSvg.slice(0, 200));
        
        // Re-encode to data URI
        const optimizedDataUri = 'data:image/svg+xml;base64,' + btoa(optimizedSvg);
        
        setImageData(optimizedDataUri);
        setLoadingMessage('Loading background image...');
      } catch (e) {
        console.error('[FortuneCard] Failed to decode tokenURI', e);
        setLoadingMessage('Error loading fortune');
      }
    }
  }, [tokenURI]);

  return (
    <div className="max-w-4xl mx-auto text-center min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-4xl font-bold mb-8">Your Fortune</h2>
      
      {!imageData && (
        <div className="mb-8 p-12 border-4 border-white/50 bg-black/80 backdrop-blur-sm">
          <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-6" />
          <div className="text-xl text-white">{loadingMessage}</div>
        </div>
      )}

      {imageData && (
        <div className="mb-8 border-4 border-white bg-black relative" style={{ maxWidth: '1920px', width: '100%', aspectRatio: '16/9' }}>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
                <div className="text-white">{loadingMessage}</div>
              </div>
            </div>
          )}
          <object
            data={imageData}
            type="image/svg+xml"
            className="w-full h-full"
            onLoad={() => {
              console.log('[FortuneCard] SVG loaded successfully');
              setTimeout(() => setImageLoaded(true), 500); // Small delay for image to fully render
            }}
          >
            <div className="p-8 text-white">
              Your browser cannot display this SVG.
              <a href={imageData} target="_blank" className="underline ml-2">
                Open in new tab
              </a>
            </div>
          </object>
        </div>
      )}

      <p className="text-sm text-gray-400 mb-8">
        Fortune #{tokenId.toString()}
      </p>
    </div>
  );
}