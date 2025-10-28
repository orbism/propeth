'use client';

import Image from 'next/image';
import { CardDisplay } from './CardDisplay';
import { useReadContract } from 'wagmi';
import { PACK1155_ADDRESS, PACK1155_ABI } from '../lib/contracts';

interface TriptychProps {
  cardIds: readonly [bigint, bigint, bigint];
  onContinue: () => void;
  hasFortune?: boolean;
}

export function Triptych({ cardIds, onContinue, hasFortune }: TriptychProps) {
  
  // Get the metadata URI from the contract
  const { data: metadataUri } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'uri',
    args: [BigInt(0)], // ERC1155 uses same base URI for all tokens
  });
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Decorative Frame Corners */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <Image
          src="/images/frame_tl.png"
          alt=""
          width={200}
          height={200}
          className="absolute top-0 left-0"
        />
        <Image
          src="/images/frame_tr.png"
          alt=""
          width={200}
          height={200}
          className="absolute top-0 right-0"
        />
        <Image
          src="/images/frame_bl.png"
          alt=""
          width={200}
          height={200}
          className="absolute bottom-0 left-0"
        />
        <Image
          src="/images/frame_br.png"
          alt=""
          width={200}
          height={200}
          className="absolute bottom-0 right-0"
        />
      </div>

      {/* Content */}
      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen p-8">
        <h2 className="text-4xl md:text-6xl font-bold mb-12 text-white drop-shadow-2xl">
          Your Triptych
        </h2>

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
                className="w-72 h-96 border-4 border-white/80 bg-black/60 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4 opacity-80">🂠</div>
                  <div className="text-xl">Card #{id.toString()}</div>
                </div>
              </div>
            )
          ))}
        </div>

        <button
          onClick={onContinue}
          className="px-16 py-8 !text-4xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm"
        >
          {hasFortune ? 'You have already received your fortune. Read it again' : 'What Does it mean?!'}
        </button>
      </div>
    </div>
  );
}