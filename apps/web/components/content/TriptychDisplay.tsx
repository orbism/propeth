'use client';

import { useState, useEffect, useRef } from 'react';
import { useReadContract, useAccount, usePublicClient } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { PACK1155_ADDRESS, PACK1155_ABI } from '@/lib/contracts';

interface CardMetadata {
  name: string;
  description: string;
  animation_url: string;
}

interface TriptychDisplayProps {
  cardIds?: readonly [bigint, bigint, bigint] | null;
  hasFortune?: boolean;
}

export function TriptychDisplay({ cardIds: providedCardIds, hasFortune }: TriptychDisplayProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { setCurrentStep, fortuneTokenId, setTriptychIds, triptychIds } = useAppStore();
  const [cardMetadata, setCardMetadata] = useState<(CardMetadata | null)[]>([null, null, null]);
  const [isLoadingCards, setIsLoadingCards] = useState(!providedCardIds && !triptychIds);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [videosReady, setVideosReady] = useState<boolean[]>([false, false, false]);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null]);

  // Use provided cards or from store
  const cardIds = providedCardIds || triptychIds;

  const { data: metadataUri } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'uri',
    args: [BigInt(0)],
  });

  // Fetch card IDs from contract if not in store
  useEffect(() => {
    if (cardIds) return; // Already have cards
    if (!address || !publicClient) return;

    const fetchCardIds = async () => {
      try {
        console.log('[TriptychDisplay] Fetching card IDs from balances for:', address);

        // Query balances for all 15 cards
        const balancePromises = Array.from({ length: 15 }, (_, i) =>
          publicClient.readContract({
            address: PACK1155_ADDRESS,
            abi: PACK1155_ABI,
            functionName: 'balanceOf',
            args: [address, BigInt(i)],
          })
        );

        const balances = await Promise.all(balancePromises);
        const ownedCards: bigint[] = [];

        balances.forEach((balance, id) => {
          if (balance && balance > BigInt(0)) {
            ownedCards.push(BigInt(id));
          }
        });

        console.log('[TriptychDisplay] User owns cards:', ownedCards.map(String));

        // Use the last 3 owned cards (most recently minted)
        if (ownedCards.length >= 3) {
          const ids = [ownedCards[ownedCards.length - 3], ownedCards[ownedCards.length - 2], ownedCards[ownedCards.length - 1]] as const;
          console.log('[TriptychDisplay] Got card IDs:', ids.map(String));
          setTriptychIds(ids);
          setIsLoadingCards(false);
        } else {
          console.warn('[TriptychDisplay] Not enough owned cards found');
          setIsLoadingCards(false);
        }
      } catch (error) {
        console.error('[TriptychDisplay] Failed to fetch card IDs:', error);
        setIsLoadingCards(false);
      }
    };

    fetchCardIds();
  }, [address, publicClient, cardIds, setTriptychIds]);

  // Fetch metadata for all three cards
  useEffect(() => {
    if (!metadataUri || !cardIds) return;

    const fetchAllMetadata = async () => {
      const metadata: (CardMetadata | null)[] = [null, null, null];

      const fetchPromises = cardIds.map(async (id, i) => {
        try {
          const url = `${metadataUri}${id}.json`.replace('ipfs://', 'https://ipfs.io/ipfs/');
          const response = await fetch(url);
          const data = await response.json();
          metadata[i] = {
            name: data.name,
            description: data.description,
            animation_url: data.animation_url
          };
        } catch (error) {
          console.error(`Failed to fetch metadata for card ${i}:`, error);
        }
      });

      await Promise.all(fetchPromises);
      setCardMetadata(metadata);
      setMetadataLoaded(true);
    };

    fetchAllMetadata();
  }, [metadataUri, cardIds]);

  // Handle video ready state
  const handleVideoCanPlay = (index: number) => {
    setVideosReady(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const handleContinue = () => {
    if (fortuneTokenId !== null) {
      setCurrentStep('complete');
    } else {
      setCurrentStep('fortune-reveal');
    }
  };

  // Check if all cards are ready to display
  const allMetadataReady = metadataLoaded && cardMetadata.every(m => m !== null);
  const allVideosReady = videosReady.every(v => v);
  const allReady = allMetadataReady && allVideosReady;

  // Loading state while fetching cards
  if (isLoadingCards || !cardIds) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
        <div className="text-6xl mystic-spinner mb-6">&#9788;</div>
        <p className="text-3xl text-white jacquard-12">Revealing your fate...</p>
        <p className="text-lg text-white/50 mt-2">The cards are being drawn</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h2 className="text-4xl md:text-5xl font-bold mb-16 text-white drop-shadow-2xl !pb-6 !-mt-6 jacquard-12">
        Your fate
      </h2>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {cardIds.map((id, index) => (
          <div key={index} className="w-80 h-[424px] border-4 border-white/30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden">
            {/* Show loader until all cards are ready */}
            {!allReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                <div className="text-4xl mystic-spinner mb-4">&#9788;</div>
                <div className="text-white/70 jacquard-12 text-lg">drawing your card...</div>
              </div>
            )}

            {/* Video - hidden until all ready, but loading in background */}
            {cardMetadata[index]?.animation_url && (
              <video
                ref={el => { videoRefs.current[index] = el; }}
                autoPlay
                muted
                loop
                playsInline
                onCanPlay={() => handleVideoCanPlay(index)}
                className={`w-full h-full object-cover ${allReady ? 'opacity-100' : 'opacity-0'}`}
              >
                <source
                  src={cardMetadata[index]!.animation_url.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  type="video/mp4"
                />
              </video>
            )}
          </div>
        ))}
      </div>

      {/* Titles and Descriptions Below Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 !mb-4 text-center w-full max-w-5xl">
        {cardMetadata.map((metadata, index) => (
          <div key={index} className="text-white">
            {allReady ? (
              <>
                <p className="text-xl font-bold mb-2">{metadata?.name || `Card ${index + 1}`}</p>
                <p className="text-sm opacity-70">{metadata?.description || ''}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold mb-2 opacity-50">...</p>
                <p className="text-sm opacity-30">Loading...</p>
              </>
            )}
          </div>
        ))}
      </div>

      <p className="text-lg opacity-70 mb-16 text-center">
        {!hasFortune && "(do a reading)"}
      </p>

      <button
        onClick={handleContinue}
        disabled={!allReady}
        className={`px-16 py-8 !text-4xl font-bold border-4 border-white text-white transition-all duration-300 backdrop-blur-sm ${
          allReady
            ? 'hover:bg-white hover:text-black cursor-pointer'
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        {hasFortune ? 'You have already received your fortune. Read it again' : 'What does it mean?!'}
      </button>
    </div>
  );
}
