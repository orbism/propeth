'use client';

import { useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import Link from 'next/link';
import { PACK1155_ADDRESS, PACK1155_ABI } from '@/lib/contracts';
import { ipfsToGateway, ipfsToProxy } from '@/lib/ipfs';

interface UnfinishedReadingCardProps {
  cardIds: [string, string, string];
}

interface CardMetadata {
  name: string;
  animation_url: string;
}

export function UnfinishedReadingCard({ cardIds }: UnfinishedReadingCardProps) {
  const [cardMetadata, setCardMetadata] = useState<(CardMetadata | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);
  const [videosReady, setVideosReady] = useState<boolean[]>([false, false, false]);

  // Batch-fetch uri(cardId) for all 3 cards
  const { data: cardUris } = useReadContracts({
    contracts: cardIds.map((id) => ({
      address: PACK1155_ADDRESS,
      abi: PACK1155_ABI,
      functionName: 'uri' as const,
      args: [BigInt(id)],
    })),
  });

  // Fetch card metadata using the per-card URIs
  useEffect(() => {
    if (!cardUris || cardUris.some((r) => !r.result)) return;

    const fetchCards = async () => {
      const metadata: (CardMetadata | null)[] = [null, null, null];

      const fetchPromises = cardIds.map(async (id, i) => {
        try {
          // uri(cardId) returns the full path (e.g. ipfs://bafybei.../5.json)
          const url = ipfsToGateway(cardUris[i].result as string);
          const response = await fetch(url);
          const data = await response.json();
          metadata[i] = { name: data.name, animation_url: data.animation_url };
        } catch (error) {
          console.error(`Failed to fetch card ${i} metadata:`, error);
        }
      });

      await Promise.all(fetchPromises);
      setCardMetadata(metadata);
      setLoading(false);
    };

    fetchCards();
  }, [cardUris, cardIds]);

  const handleVideoCanPlay = (index: number) => {
    setVideosReady(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const allMetadataReady = !loading && cardMetadata.every(m => m !== null);
  const allVideosReady = videosReady.every(v => v);
  const allReady = allMetadataReady && allVideosReady;

  return (
    <div className="text-center" style={{ margin: '3em' }}>
      {/* Pulsing border container */}
      <div
        className="py-10 px-8 border-2 border-[#d4c4a8]/60 bg-black/40 backdrop-blur-sm rounded-[10px]"
        style={{ animation: 'pulse-border 2s ease-in-out infinite' }}
      >
        {/* Header */}
        <h3 className="text-5xl jacquard-12 text-[#d4c4a8] mb-4">
          Unfinished Reading
        </h3>
        <p className="text-lg text-white/70 mb-8">
          You drew these cards but haven&apos;t received your fortune yet
        </p>

        {/* Triptych Cards */}
        <div className="flex justify-center gap-6 flex-wrap mb-8">
          {cardIds.map((id, i) => (
            <div
              key={i}
              className="w-48 h-64 bg-black/40 overflow-hidden relative"
            >
              {/* Show loader until all cards are ready */}
              {!allReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                  <div className="text-3xl mystic-spinner mb-2">&#9788;</div>
                  <div className="text-white/50 text-sm">loading...</div>
                </div>
              )}

              {cardMetadata[i]?.animation_url && (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  onCanPlay={() => handleVideoCanPlay(i)}
                  className={`w-full h-full object-cover ${allReady ? 'opacity-100' : 'opacity-0'}`}
                >
                  <source
                    src={ipfsToProxy(cardMetadata[i]!.animation_url)}
                    type="video/mp4"
                  />
                </video>
              )}

              {/* Card name overlay */}
              {allReady && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-sm p-2 text-center truncate">
                  {cardMetadata[i]?.name || `#${id}`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          href="/"
          className="inline-block !text-3xl text-[#d4c4a8] hover:text-white transition-all duration-300 jacquard-12"
          style={{ padding: '1em' }}
        >
          Complete Your Reading
        </Link>
      </div>
    </div>
  );
}
