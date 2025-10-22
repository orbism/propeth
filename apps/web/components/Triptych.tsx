'use client';

import Image from 'next/image';

interface TriptychProps {
  cardIds: readonly [bigint, bigint, bigint];
  onContinue: () => void;
}

export function Triptych({ cardIds, onContinue }: TriptychProps) {
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
            <div
              key={index}
              className="w-72 h-96 border-4 border-white/80 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center relative"
            >
              {/* Card Frame Corner Decorations */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-white/60"></div>
                <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-white/60"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-white/60"></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-white/60"></div>
              </div>

              <div className="text-center p-4 relative z-10">
                <div className="text-6xl mb-6 opacity-80">🂠</div>
                <div className="text-xl font-bold mb-2">Card #{id.toString()}</div>
                <div className="text-sm opacity-70">
                  {index === 0 ? 'The End' : index === 1 ? 'Eclipse' : 'Suspicion'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="px-16 py-8 text-2xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm"
        >
          What Does it mean?!
        </button>
      </div>
    </div>
  );
}