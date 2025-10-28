'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { PACK1155_ADDRESS, PACK1155_ABI, FORTUNE721_ADDRESS, FORTUNE721_ABI } from '@/lib/contracts';

interface FourthCardProps {
  cardIds: readonly [bigint, bigint, bigint];
}

export function FourthCard({ cardIds }: FourthCardProps) {
  const { address } = useAccount();
  const { setFortuneTokenId, setFortuneTxHash, setCurrentStep } = useAppStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [ownsCards, setOwnsCards] = useState(false);

  const { data: balance1 } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'balanceOf',
    args: [address!, cardIds[0]],
    enabled: !!address,
  });

  const { data: balance2 } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'balanceOf',
    args: [address!, cardIds[1]],
    enabled: !!address,
  });

  const { data: balance3 } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'balanceOf',
    args: [address!, cardIds[2]],
    enabled: !!address,
  });

  useEffect(() => {
    if (balance1 !== undefined && balance2 !== undefined && balance3 !== undefined) {
      setIsVerifying(false);
      const ownsAllCards = balance1 > 0n && balance2 > 0n && balance3 > 0n;
      setOwnsCards(ownsAllCards);
    }
  }, [balance1, balance2, balance3]);

  const {
    writeContract: mintFortune,
    data: fortuneHash,
    isPending: isMintingFortune,
    error: fortuneError,
  } = useWriteContract();

  const { isLoading: isConfirmingFortune, isSuccess: fortuneSuccess, data: fortuneReceipt } = useWaitForTransactionReceipt({
    hash: fortuneHash,
  });

  useEffect(() => {
    if (fortuneSuccess && fortuneReceipt) {
      const log = fortuneReceipt.logs.find(
        (log) =>
          log.address.toLowerCase() === FORTUNE721_ADDRESS.toLowerCase()
      );

      if (log) {
        setFortuneTokenId(1n);
        setFortuneTxHash(fortuneHash || null);
        setTimeout(() => setCurrentStep('complete'), 1000);
      }
    }
  }, [fortuneSuccess, fortuneReceipt, fortuneHash, setFortuneTokenId, setFortuneTxHash, setCurrentStep]);

  const handleMintFortune = () => {
    if (!ownsCards) return;

    mintFortune({
      address: FORTUNE721_ADDRESS,
      abi: FORTUNE721_ABI,
      functionName: 'mintFromTriptych',
      args: [cardIds],
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <div className="w-full max-w-2xl">
        <div className="space-y-8">
          {isVerifying ? (
            <div className="text-center p-8">
              <div className="animate-spin text-4xl mb-4">⟳</div>
              <div className="text-lg">Verifying your triptych...</div>
            </div>
          ) : ownsCards ? (
            <div className="text-center p-8 border-2 border-green-400 bg-green-400/10">
              <h3 className="text-2xl font-bold mb-4 text-green-400">
                ✓ You hold all three cards
              </h3>
              <p className="text-lg mb-6">
                The Great Propeth will now reveal your complete fortune through the fourth card.
              </p>
              <button
                onClick={handleMintFortune}
                disabled={isMintingFortune || isConfirmingFortune}
                className="px-12 py-6 text-2xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
              >
                {isMintingFortune || isConfirmingFortune ? 'Revealing...' : 'Reveal Final Card (Free)'}
              </button>
              {(isMintingFortune || isConfirmingFortune) && (
                <div className="mt-4 text-sm opacity-70">
                  Confirm transaction in your wallet...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-red-400 bg-red-400/10">
              <h3 className="text-2xl font-bold mb-4 text-red-400">
                ✗ Cards Missing
              </h3>
              <p className="text-lg mb-6">
                You must hold all three cards from your triptych to receive the final revelation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
