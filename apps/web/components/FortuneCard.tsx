'use client';

import { useReadContract } from 'wagmi';
import { FORTUNE721_ADDRESS, FORTUNE721_ABI } from '@/lib/contracts';
import { useState, useEffect } from 'react';

interface FortuneCardProps {
  tokenId: bigint;
}

export function FortuneCard({ tokenId }: FortuneCardProps) {
  const [imageData, setImageData] = useState<string>('');

  const { data: tokenURI } = useReadContract({
    address: FORTUNE721_ADDRESS,
    abi: FORTUNE721_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  });

  useEffect(() => {
    if (tokenURI) {
      // Decode base64 JSON
      try {
        const json = JSON.parse(atob(tokenURI.replace('data:application/json;base64,', '')));
        setImageData(json.image);
      } catch (e) {
        console.error('Failed to decode tokenURI', e);
      }
    }
  }, [tokenURI]);

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-4xl font-bold mb-8">Your Fortune</h2>
      
      {imageData && (
        <div className="mb-8 border-2 border-white p-4">
          <img 
            src={imageData} 
            alt={`Fortune #${tokenId}`}
            className="w-full max-w-md mx-auto"
          />
        </div>
      )}

      <p className="text-sm text-gray-400 mb-8">
        Fortune #{tokenId.toString()}
      </p>
    </div>
  );
}