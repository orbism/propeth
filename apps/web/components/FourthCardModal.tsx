'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { PACK1155_ADDRESS, PACK1155_ABI, FORTUNE721_ADDRESS, FORTUNE721_ABI } from '@/lib/contracts';
import Image from 'next/image';

interface FourthCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardIds: readonly [bigint, bigint, bigint];
}

export function FourthCardModal({ isOpen, onClose, cardIds }: FourthCardModalProps) {
  const { address } = useAccount();
  const { setFortuneTokenId, setFortuneTxHash } = useAppStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [ownsCards, setOwnsCards] = useState(false);

  // Check if user owns all 3 cards
  const { data: balance1 } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'balanceOf',
    args: [address!, cardIds[0]],
    enabled: !!address && isOpen,
  });

  const { data: balance2 } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'balanceOf',
    args: [address!, cardIds[1]],
    enabled: !!address && isOpen,
  });

  const { data: balance3 } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'balanceOf',
    args: [address!, cardIds[2]],
    enabled: !!address && isOpen,
  });

  useEffect(() => {
    if (isOpen && balance1 !== undefined && balance2 !== undefined && balance3 !== undefined) {
      setIsVerifying(false);
      const ownsAllCards = balance1 > 0n && balance2 > 0n && balance3 > 0n;
      setOwnsCards(ownsAllCards);
    }
  }, [isOpen, balance1, balance2, balance3]);

  // Mint fortune contract
  const {
    writeContract: mintFortune,
    data: fortuneHash,
    isPending: isMintingFortune,
    error: fortuneError,
  } = useWriteContract();

  // Wait for fortune mint receipt
  const { isLoading: isConfirmingFortune, isSuccess: fortuneSuccess, data: fortuneReceipt } = useWaitForTransactionReceipt({
    hash: fortuneHash,
  });

  useEffect(() => {
    if (fortuneSuccess && fortuneReceipt) {
      // Extract token ID from FortuneMinted event
      const log = fortuneReceipt.logs.find(
        (log) =>
          log.address.toLowerCase() === FORTUNE721_ADDRESS.toLowerCase()
      );

      if (log) {
        // In production, you'd decode the event log properly
        // For now, we'll use a placeholder
        setFortuneTokenId(1n); // TODO: decode from log
        setFortuneTxHash(fortuneHash || null);
      }
    }
  }, [fortuneSuccess, fortuneReceipt, fortuneHash, setFortuneTokenId, setFortuneTxHash]);

  const handleMintFortune = () => {
    if (!ownsCards) return;

    mintFortune({
      address: FORTUNE721_ADDRESS,
      abi: FORTUNE721_ABI,
      functionName: 'mintFromTriptych',
      args: [cardIds],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-black border-4 border-white text-white p-8 max-w-2xl w-full">
        {/* Decorative Frame Corners */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/images/frame_tl.png"
            alt=""
            width={150}
            height={150}
            className="absolute top-0 left-0"
          />
          <Image
            src="/images/frame_tr.png"
            alt=""
            width={150}
            height={150}
            className="absolute top-0 right-0"
          />
          <Image
            src="/images/frame_bl.png"
            alt=""
            width={150}
            height={150}
            className="absolute bottom-0 left-0"
          />
          <Image
            src="/images/frame_br.png"
            alt=""
            width={150}
            height={150}
            className="absolute bottom-0 right-0"
          />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">The Final Revelation</h2>
            <button onClick={onClose} className="text-4xl hover:opacity-70">
              ×
            </button>
          </div>

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
                <button
                  onClick={onClose}
                  className="px-12 py-6 text-2xl font-bold border-4 border-white text-white hover:bg-white hover:text-black transition-all duration-300"
                >
                  Return to Triptych
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
