'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useAppStore } from '@/lib/store';
import Image from 'next/image';

interface TokenCheckModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function TokenCheckModal({ isOpen, onComplete }: TokenCheckModalProps) {
  const { address } = useAccount();
  const { setPromiseHolderStatus, setCurrentStep } = useAppStore();
  const [isChecking, setIsChecking] = useState(true);

  // Promise token contract address and token ID
  const PROMISE_CONTRACT = '0x2eaa8c468aa638c88bd704e3a2b03d9926f0b397';
  const PROMISE_TOKEN_ID = 3n;

  // Check balance of Promise token
  const { data: balance, isLoading } = useReadContract({
    address: PROMISE_CONTRACT as `0x${string}`,
    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        inputs: [
          { name: 'account', type: 'address' },
          { name: 'id', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'balanceOf',
    args: [address!, PROMISE_TOKEN_ID],
    enabled: !!address && isOpen,
  });

  useEffect(() => {
    if (isOpen && !isLoading && balance !== undefined) {
      setIsChecking(false);

      // Check if user has at least 1 Promise token
      const hasPromise = balance > 0n;
      setPromiseHolderStatus(hasPromise);

      // Brief delay to show checking state, then proceed
      setTimeout(() => {
        setCurrentStep('mint-choice');
        onComplete();
      }, 1000);
    }
  }, [isOpen, isLoading, balance, setPromiseHolderStatus, setCurrentStep, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-black border-4 border-white text-white p-8 max-w-md w-full text-center">
        {/* Decorative Frame Corners */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/images/frame_tl.png"
            alt=""
            width={100}
            height={100}
            className="absolute top-0 left-0"
          />
          <Image
            src="/images/frame_tr.png"
            alt=""
            width={100}
            height={100}
            className="absolute top-0 right-0"
          />
          <Image
            src="/images/frame_bl.png"
            alt=""
            width={100}
            height={100}
            className="absolute bottom-0 left-0"
          />
          <Image
            src="/images/frame_br.png"
            alt=""
            width={100}
            height={100}
            className="absolute bottom-0 right-0"
          />
        </div>

        <div className="relative z-10">
          <div className="text-2xl font-bold mb-6">Checking your fate...</div>

          {isChecking ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin text-4xl">⟳</div>
              <div className="text-lg">Looking for A Promise...</div>
            </div>
          ) : (
            <div className="text-lg">
              {balance && balance > 0n ? (
                <div className="text-green-400">✓ Found A Promise!</div>
              ) : (
                <div className="text-yellow-400">No Promise found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
