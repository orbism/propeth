'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useAppStore } from '@/lib/store';
import { ModalFrame } from '@/components/ui/ModalFrame';

interface TokenCheckModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function TokenCheckModal({ isOpen, onComplete }: TokenCheckModalProps) {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const setPromiseHolderStatus = useAppStore((s) => s.setPromiseHolderStatus);
  const [isChecking, setIsChecking] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Looking for A Promise...');
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false);
  const alreadyHandledRef = useRef(false);

  useEffect(() => {
    if (!isOpen || alreadyHandledRef.current || !address) return;

    console.log('🎰 [TokenCheckModal] Starting check', {
      address,
      chain: chain?.name,
      chainId: chain?.id,
      isMainnet: chain?.id === mainnet.id,
    });

    // Check if user is on mainnet
    if (chain?.id !== mainnet.id) {
      console.warn('⚠️  [TokenCheckModal] User not on mainnet, prompting switch');
      setNeedsNetworkSwitch(true);
      setStatusMessage('Please switch to Ethereum Mainnet');
      setIsChecking(false);
      return;
    }

    setNeedsNetworkSwitch(false);
    alreadyHandledRef.current = true;

    const checkHoldings = async () => {
      try {
        console.log('📡 [TokenCheckModal] Calling /api/holds', { address });
        setStatusMessage('Checking with oracles...');

        const response = await fetch(`/api/holds?owner=${address}`);
        const data = await response.json();

        console.log('📦 [TokenCheckModal] API response', data);

        if (!response.ok) {
          console.error('❌ [TokenCheckModal] API error', data);
          setPromiseHolderStatus(false);
          setStatusMessage('Check failed, proceeding anyway...');
          setTimeout(() => onComplete(), 1000);
          return;
        }

        const hasPromise = data.holds === true;
        console.log('✅ [TokenCheckModal] Holdings check complete', {
          holds: hasPromise,
          balance: data.balance,
          debug: data.debug,
        });

        setPromiseHolderStatus(hasPromise);
        setStatusMessage(hasPromise ? '✓ Found A Promise!' : 'No Promise found');
        setIsChecking(false);

        setTimeout(() => onComplete(), 800);
      } catch (error: any) {
        console.error('💥 [TokenCheckModal] Unexpected error', {
          error: error.message,
          stack: error.stack,
        });
        setPromiseHolderStatus(false);
        setStatusMessage('Check failed, proceeding anyway...');
        setTimeout(() => onComplete(), 1000);
      }
    };

    checkHoldings();
  }, [isOpen, address, chain, setPromiseHolderStatus, onComplete]);

  const handleSwitchNetwork = () => {
    console.log('🔄 [TokenCheckModal] User requested network switch to mainnet');
    if (switchChain) {
      switchChain({ chainId: mainnet.id });
      // Reset to allow re-check after switch
      alreadyHandledRef.current = false;
      setIsChecking(true);
      setStatusMessage('Looking for A Promise...');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalFrame isOpen={isOpen}>
      <div className="text-center">
        <div className="text-3xl font-bold mb-6 jacquard-12">Checking your fate...</div>

        {needsNetworkSwitch ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-yellow-400 text-3xl jacquard-12">{statusMessage}</div>
            <button
              onClick={handleSwitchNetwork}
              className="px-8 py-4 text-3xl border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 jacquard-12"
            >
              Switch to Mainnet
            </button>
          </div>
        ) : isChecking ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin text-4xl">⟳</div>
            <div className="text-3xl jacquard-12">{statusMessage}</div>
          </div>
        ) : (
          <div className="text-lg">
            {statusMessage.includes('✓') ? (
              <div className="text-green-400 jacquard-12 text-3xl">{statusMessage}</div>
            ) : (
              <div className="text-yellow-400 jacquard-12 text-3xl">{statusMessage}</div>
            )}
          </div>
        )}
      </div>
    </ModalFrame>
  );
}
