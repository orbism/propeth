'use client';

import { useState, useEffect } from 'react';
import { ipfsToGateway } from '@/lib/ipfs';

interface CardMetadata {
  name: string;
  description: string;
  image: string;
  animation_url: string;
}

interface CardDisplayProps {
  cardId: bigint;
  metadataUri: string;
}

export function CardDisplay({ cardId, metadataUri }: CardDisplayProps) {
  const [metadata, setMetadata] = useState<CardMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        // Construct the URL for the specific card
        const url = ipfsToGateway(`${metadataUri}${cardId}.json`);
        const response = await fetch(url);
        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error('Failed to fetch card metadata:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [cardId, metadataUri]);

  if (loading) {
    return (
      <div className="w-80 h-[424px] border-4 border-white/30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="text-4xl mystic-spinner mb-4">&#9788;</div>
        <div className="text-white/70 jacquard-12 text-lg">drawing your card...</div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="w-72 h-96 border-4 bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="text-white">Card #{cardId.toString()}</div>
      </div>
    );
  }

  const videoUrl = ipfsToGateway(metadata.animation_url);

  return (
    <div className="w-80 h-[424px] border-4 border-black bg-black/60 backdrop-blur-sm flex flex-col relative overflow-hidden">
      {/* Video Background - Full Card */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
}
