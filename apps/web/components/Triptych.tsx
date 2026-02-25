'use client';

import Image from 'next/image';
import { CardDisplay } from './CardDisplay';

interface TriptychProps {
  cardIds: readonly [bigint, bigint, bigint];
  onContinue: () => void;
  hasFortune?: boolean;
}

export function Triptych({ cardIds, onContinue, hasFortune }: TriptychProps) {
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
          style={{ width: 'auto', height: 'auto' }}
        />
        <Image
          src="/images/frame_tr.png"
          alt=""
          width={200}
          height={200}
          className="absolute top-0 right-0"
          style={{ width: 'auto', height: 'auto' }}
        />
        <Image
          src="/images/frame_bl.png"
          alt=""
          width={200}
          height={200}
          className="absolute bottom-0 left-0"
          style={{ width: 'auto', height: 'auto' }}
        />
        <Image
          src="/images/frame_br.png"
          alt=""
          width={200}
          height={200}
          className="absolute bottom-0 right-0"
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen p-8">
        <h2 className="text-4xl md:text-6xl font-bold mb-12 text-white drop-shadow-2xl">
          Your Triptych
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {cardIds.map((id, index) => (
            <CardDisplay
              key={index}
              cardId={id}
            />
          ))}
        </div>

        <button
          onClick={onContinue}
          className="px-16 py-8 !text-4xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm"
        >
          {hasFortune ? 'You have already received your fortune. Read it again' : 'What does it mean?!'}
        </button>
      </div>
    </div>
  );
}
