'use client';

import { useState, useEffect } from 'react';
import { CardDisplay } from '../CardDisplay';
import { useReadContract } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { PACK1155_ADDRESS, PACK1155_ABI } from '@/lib/contracts';

interface CardMetadata {
  name: string;
  description: string;
}

interface TriptychDisplayProps {
  cardIds: readonly [bigint, bigint, bigint];
  hasFortune?: boolean;
}

export function TriptychDisplay({ cardIds, hasFortune }: TriptychDisplayProps) {
  const { setCurrentStep, fortuneTokenId } = useAppStore();
  const [cardMetadata, setCardMetadata] = useState<(CardMetadata | null)[]>([null, null, null]);
  
  const { data: metadataUri } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'uri',
    args: [BigInt(0)],
  });

  // Fetch metadata for all three cards
  useEffect(() => {
    if (!metadataUri) return;

    const fetchAllMetadata = async () => {
      const metadata: (CardMetadata | null)[] = [null, null, null];
      
      for (let i = 0; i < cardIds.length; i++) {
        try {
          const url = `${metadataUri}${cardIds[i]}.json`.replace('ipfs://', 'https://ipfs.io/ipfs/');
          const response = await fetch(url);
          const data = await response.json();
          metadata[i] = { name: data.name, description: data.description };
        } catch (error) {
          console.error(`Failed to fetch metadata for card ${i}:`, error);
        }
      }
      
      setCardMetadata(metadata);
    };

    fetchAllMetadata();
  }, [metadataUri, cardIds]);

  const handleContinue = () => {
    if (fortuneTokenId !== null) {
      setCurrentStep('complete');
    } else {
      setCurrentStep('fortune-reveal');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h2 className="text-4xl md:text-5xl font-bold mb-16 text-white drop-shadow-2xl !pb-6 !-mt-6 jacquard-12">
        Your fate
      </h2>

      {/* Cards Grid - Video Only */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {cardIds.map((id, index) => (
          metadataUri ? (
            <CardDisplay 
              key={index} 
              cardId={id} 
              metadataUri={metadataUri}
            />
          ) : (
            <div
              key={index}
              className="w-80 h-[424px] border-4 border-white/80 bg-black/60 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-80">🂠</div>
                <div className="text-xl">Card #{id.toString()}</div>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Titles and Descriptions Below Cards - Centered with grid alignment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 !mb-4 text-center w-full max-w-5xl">
        {cardMetadata.map((metadata, index) => (
          <div key={index} className="text-white">
            <p className="text-xl font-bold mb-2">{metadata?.name || `Card ${index + 1}`}</p>
            <p className="text-sm opacity-70">{metadata?.description || 'Loading...'}</p>
          </div>
        ))}
      </div>

      <p className="text-lg opacity-70 mb-16 text-center">
        {!hasFortune && "(do a reading)"}
      </p>

      <button
        onClick={handleContinue}
        className="px-16 py-8 !text-4xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm"
      >
        {hasFortune ? 'You have already received your fortune. Read it again' : 'What Does it mean?!'}
      </button>
    </div>
  );
}
