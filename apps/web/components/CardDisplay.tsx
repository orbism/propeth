'use client';

import { useState, useEffect } from 'react';

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
        const url = `${metadataUri}${cardId}.json`.replace('ipfs://', 'https://ipfs.io/ipfs/');
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
      <div className="w-72 h-96 border-4 bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
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

  const videoUrl = metadata.animation_url.replace('ipfs://', 'https://ipfs.io/ipfs/');

  return (
    <div className="w-72 h-96 border-4 border-black bg-black/60 backdrop-blur-sm flex flex-col relative overflow-hidden">
      {/* Card Frame Corner Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-white/60"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-white/60"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-white/60"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-white/60"></div>
      </div>

      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col justify-end h-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <h3 className="text-2xl font-bold text-white mb-2">{metadata.name}</h3>
        <p className="text-sm text-white/80 line-clamp-3">{metadata.description}</p>
      </div>
    </div>
  );
}
