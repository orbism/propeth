'use client';

import { useState, useEffect, useRef } from 'react';
import { useReadContract } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { PACK1155_ADDRESS, PACK1155_ABI } from '@/lib/contracts';
import { ipfsToGateway, ipfsToProxy } from '@/lib/ipfs';
import { useUserFortunes } from '@/lib/hooks/useUserFortunes';

interface CardMetadata {
  name: string;
  description: string;
  animation_url: string;
  image: string;
}

interface TriptychDisplayProps {
  cardIds?: readonly [string, string, string] | null;
  hasFortune?: boolean;
}

export function TriptychDisplay({ cardIds: providedCardIds, hasFortune }: TriptychDisplayProps) {
  const { setCurrentStep, fortuneTokenId, setTriptychIds, triptychIds: storeTriptychIds } = useAppStore();

  // Use useUserFortunes to get unfinished reading cards
  const { unfinishedReading, isLoading: isLoadingFortunes } = useUserFortunes();

  // Track if we've synced to prevent loops
  const hasSyncedRef = useRef(false);

  // Priority: props > store > useUserFortunes hook (all are strings now)
  const hookCardIds = unfinishedReading?.cardIds || null;
  const cardIds = providedCardIds || storeTriptychIds || hookCardIds;

  // Update store if we got cards from useUserFortunes (only once)
  useEffect(() => {
    console.log('[TriptychDisplay] Sync check:', {
      hasSynced: hasSyncedRef.current,
      storeTriptychIds,
      hookCardIds,
      providedCardIds,
    });
    if (!hasSyncedRef.current && !storeTriptychIds && hookCardIds) {
      console.log('[TriptychDisplay] Syncing hookCardIds to store:', hookCardIds);
      hasSyncedRef.current = true;
      setTriptychIds(hookCardIds);
    }
  }, [storeTriptychIds, hookCardIds, setTriptychIds, providedCardIds]);

  const [cardMetadata, setCardMetadata] = useState<(CardMetadata | null)[]>([null, null, null]);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [videosReady, setVideosReady] = useState<boolean[]>([false, false, false]);

  // Determine loading state
  const isLoadingCards = isLoadingFortunes && !cardIds;

  const { data: metadataUri } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'uri',
    args: [BigInt(0)],
  });

  // Fetch metadata for all three cards
  // Use stringified cardIds as dependency to avoid re-fetching on reference change
  const cardIdsKey = cardIds ? cardIds.map(id => id.toString()).join(',') : null;

  useEffect(() => {
    if (!metadataUri || !cardIdsKey) return;

    // Parse the card IDs from the key (already strings)
    const ids = cardIdsKey.split(',');
    console.log('[TriptychDisplay] Fetching metadata for cards:', ids);

    const fetchAllMetadata = async () => {
      const metadata: (CardMetadata | null)[] = [null, null, null];

      const fetchPromises = ids.map(async (id, i) => {
        try {
          const url = ipfsToGateway(`${metadataUri}${id}.json`);
          console.log(`[TriptychDisplay] Fetching metadata for card ${i} from:`, url);
          const response = await fetch(url);
          const data = await response.json();
          metadata[i] = {
            name: data.name,
            description: data.description,
            animation_url: data.animation_url,
            image: data.image
          };
        } catch (error) {
          console.error(`Failed to fetch metadata for card ${i}:`, error);
        }
      });

      await Promise.all(fetchPromises);
      console.log('[TriptychDisplay] Metadata loaded:', metadata.map(m => m?.name));
      setCardMetadata(metadata);
      setMetadataLoaded(true);
    };

    fetchAllMetadata();
  }, [metadataUri, cardIdsKey]);

  // Handle video ready state
  const handleVideoReady = (index: number) => {
    setVideosReady(prev => {
      if (prev[index]) return prev; // Already marked ready
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

  // Fallback timeout - if videos don't fire ready events within 5s, show them anyway
  useEffect(() => {
    if (allMetadataReady && !allVideosReady) {
      const timeout = setTimeout(() => {
        setVideosReady([true, true, true]);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [allMetadataReady, allVideosReady]);

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
          <div key={index} className="w-80 h-[424px] border-1 border-white/30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden">
            {/* Show loader until all cards are ready */}
            {!allReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                <div className="text-4xl mystic-spinner mb-4">&#9788;</div>
                <div className="text-white/70 jacquard-12 text-lg">drawing your card...</div>
              </div>
            )}

            {/* Video using proxy for CORS support */}
            {cardMetadata[index] && (
              <video
                autoPlay
                muted
                loop
                playsInline
                onCanPlay={() => handleVideoReady(index)}
                onLoadedData={() => handleVideoReady(index)}
                className="w-full h-full object-cover"
              >
                <source
                  src={ipfsToProxy(cardMetadata[index]!.animation_url)}
                  type="video/mp4"
                />
              </video>
            )}
          </div>
        ))}
      </div>

      {/* Titles and Descriptions Below Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 !mb-0 text-center w-full max-w-5xl">
        {cardMetadata.map((metadata, index) => (
          <div key={index} className="text-white h-10">
            {allReady ? (
              <>
                <p className="text-xl font-bold mb-2">{metadata?.name || `Card ${index + 1}`}</p>
                <p className="text-sm opacity-70 invisible">{metadata?.description || ''}</p>
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

      <button
        onClick={!hasFortune ? handleContinue : undefined}
        disabled={!allReady || hasFortune}
        className={`!text-2xl opacity-70 mb-16 text-center block w-full ${
          !hasFortune && allReady ? 'cursor-pointer hover:opacity-100' : ''
        }`}
      >
        {!hasFortune && "(do a reading)"}
      </button>

      <button
        onClick={handleContinue}
        disabled={!allReady}
        className={`px-16 py-8 !text-4xl font-bold border-4 border-white text-white transition-all duration-300 backdrop-blur-sm jacquard-12 ${
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
