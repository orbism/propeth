'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { PACK1155_ADDRESS, PACK1155_ABI } from '@/lib/contracts';
import { ipfsToGateway, ipfsToProxy } from '@/lib/ipfs';
import Image from 'next/image';

interface ReadingCardProps {
  tokenId: string;
  cardIds: [string, string, string];
  index: number;
}

interface CardMetadata {
  name: string;
  animation_url: string;
}

interface OverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function OverlayModal({ isOpen, onClose, children }: OverlayModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90vh] m-8"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '3em' }}
      >
        {/* Corner Frames */}
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/images/frame_tl.png" alt="" width={100} height={100} className="absolute top-0 left-0" style={{ width: 'auto', height: 'auto' }} />
          <Image src="/images/frame_tr.png" alt="" width={100} height={100} className="absolute top-0 right-0" style={{ width: 'auto', height: 'auto' }} />
          <Image src="/images/frame_bl.png" alt="" width={100} height={100} className="absolute bottom-0 left-0" style={{ width: 'auto', height: 'auto' }} />
          <Image src="/images/frame_br.png" alt="" width={100} height={100} className="absolute bottom-0 right-0" style={{ width: 'auto', height: 'auto' }} />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-5xl z-50 leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Content */}
        <div className="relative z-10 overflow-auto max-h-[calc(90vh-6em)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ReadingCard({ tokenId, cardIds, index }: ReadingCardProps) {
  const [fortuneSvg, setFortuneSvg] = useState<string>('');
  const [cardMetadata, setCardMetadata] = useState<(CardMetadata | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);
  const [fortuneModalOpen, setFortuneModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState<number | null>(null);

  // Get metadata URI from Pack1155
  const { data: metadataUri } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'uri',
    args: [BigInt(0)],
  });

  // Fetch fortune SVG
  useEffect(() => {
    const fetchFortune = async () => {
      try {
        const response = await fetch(`/api/fortune/${tokenId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.svg) {
            const blob = new Blob([data.svg], { type: 'image/svg+xml' });
            setFortuneSvg(URL.createObjectURL(blob));
          }
        }
      } catch (error) {
        console.error('Failed to fetch fortune:', error);
      }
    };

    fetchFortune();
  }, [tokenId]);

  // Fetch card metadata
  useEffect(() => {
    if (!metadataUri) return;

    const fetchCards = async () => {
      const metadata: (CardMetadata | null)[] = [null, null, null];

      for (let i = 0; i < 3; i++) {
        try {
          const url = ipfsToGateway(`${metadataUri}${cardIds[i]}.json`);
          const response = await fetch(url);
          const data = await response.json();
          metadata[i] = { name: data.name, animation_url: data.animation_url };
        } catch (error) {
          console.error(`Failed to fetch card ${i} metadata:`, error);
        }
      }

      setCardMetadata(metadata);
      setLoading(false);
    };

    fetchCards();
  }, [metadataUri, cardIds]);

  const closeFortuneModal = useCallback(() => setFortuneModalOpen(false), []);
  const closeCardModal = useCallback(() => setCardModalOpen(null), []);

  return (
    <>
      <div className="text-center">
        {/* Header - Fortune # centered */}
        <h3 className="text-6xl jacquard-12 text-white mb-8">
          Fortune #{tokenId}
        </h3>

        {/* Fortune SVG - Clickable to expand */}
        <div
          className="cursor-pointer hover:opacity-90 transition-opacity mb-4 inline-block"
          onClick={() => setFortuneModalOpen(true)}
        >
          {fortuneSvg ? (
            <div className="bg-black/30">
              <object
                data={fortuneSvg}
                type="image/svg+xml"
                className="w-full h-auto pointer-events-none"
                style={{ maxHeight: '280px' }}
              />
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="mystic-spinner text-4xl">&#9788;</div>
            </div>
          )}
        </div>

        {/* Expand hint */}
        <p className="text-sm text-white/40 mb-10">
          click to expand
        </p>

        {/* Triptych Cards */}
        <div className="mt-8">
          <p className="text-xl text-white/70 mb-6">Your 3 cards for this reading:</p>

          {loading ? (
            <div className="flex justify-center gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-48 h-64 bg-black/40 flex items-center justify-center">
                  <div className="mystic-spinner text-2xl">&#9788;</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center gap-6 flex-wrap">
              {cardMetadata.map((card, i) => (
                <div
                  key={i}
                  className="w-48 h-64 bg-black/40 overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setCardModalOpen(i)}
                >
                  {card?.animation_url ? (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source
                        src={ipfsToProxy(card.animation_url)}
                        type="video/mp4"
                      />
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50">
                      Card {cardIds[i]}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-sm p-2 text-center truncate">
                    {card?.name || `#${cardIds[i]}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Beige divider - not full width */}
      <div className="flex justify-center" style={{ marginTop: '3em', marginBottom: '3em' }}>
        <div className="w-1/3 border-b-3 border-[#d4c4a8]/60" />
      </div>

      {/* Fortune Modal */}
      <OverlayModal isOpen={fortuneModalOpen} onClose={closeFortuneModal}>
        <div className="flex flex-col items-center justify-center p-4">
          <h3 className="text-4xl jacquard-12 text-white mb-6">
            Fortune #{tokenId}
          </h3>
          {fortuneSvg && (
            <object
              data={fortuneSvg}
              type="image/svg+xml"
              className="w-full h-auto"
            />
          )}
        </div>
      </OverlayModal>

      {/* Card Modal */}
      <OverlayModal isOpen={cardModalOpen !== null} onClose={closeCardModal}>
        {cardModalOpen !== null && cardMetadata[cardModalOpen] && (
          <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-3xl jacquard-12 text-white mb-6">
              {cardMetadata[cardModalOpen]?.name || `Card #${cardIds[cardModalOpen]}`}
            </h3>
            {cardMetadata[cardModalOpen]?.animation_url && (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="max-w-full max-h-[60vh]"
              >
                <source
                  src={ipfsToProxy(cardMetadata[cardModalOpen]!.animation_url)}
                  type="video/mp4"
                />
              </video>
            )}
          </div>
        )}
      </OverlayModal>
    </>
  );
}
