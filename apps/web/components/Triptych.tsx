'use client';

interface TriptychProps {
  cardIds: readonly [bigint, bigint, bigint];
  onContinue: () => void;
}

export function Triptych({ cardIds, onContinue }: TriptychProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-3xl font-bold mb-8">Your Cards</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {cardIds.map((id, index) => (
          <div
            key={index}
            className="w-64 h-96 border-2 border-white flex items-center justify-center"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🂠</div>
              <div className="text-xl">Card #{id.toString()}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        className="px-8 py-4 text-xl font-bold border-2 border-white hover:bg-white hover:text-black transition-colors"
      >
        WHAT DOES IT MEAN?!
      </button>
    </div>
  );
}