'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useAppStore } from '@/lib/store';
import { PROMISE_CHAIN_ID } from '@/lib/env';

interface TokenCheckProps {
  onComplete: () => void;
}

export function TokenCheck({ onComplete }: TokenCheckProps) {
  const { address, chain } = useAccount();
  const { setCurrentStep, setPromiseHolderStatus } = useAppStore();
  const { switchChain } = useSwitchChain();
  const [isChecking, setIsChecking] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Looking for A Promise...');
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false);
  const alreadyHandledRef = useRef(false);

  useEffect(() => {
    if (alreadyHandledRef.current || !address) return;

    const expectedChainId = PROMISE_CHAIN_ID || mainnet.id;

    console.log('🎰 [TokenCheck] Starting check', {
      address,
      chain: chain?.name,
      chainId: chain?.id,
      expectedChainId,
      match: chain?.id === expectedChainId,
    });

    if (chain?.id !== expectedChainId) {
      const chainName = expectedChainId === 1337 ? 'Local 8545' : 
                       expectedChainId === 11155111 ? 'Sepolia' : 
                       'Ethereum Mainnet';
      console.warn(`⚠️  [TokenCheck] User not on ${chainName}, prompting switch`);
      setNeedsNetworkSwitch(true);
      setStatusMessage(`Please switch to ${chainName}`);
      setIsChecking(false);
      return;
    }

    setNeedsNetworkSwitch(false);
    alreadyHandledRef.current = true;

    const checkHoldings = async () => {
      try {
        console.log('📡 [TokenCheck] Calling /api/holds', { address });
        setStatusMessage('Checking with oracles...');

        const response = await fetch(`/api/holds?owner=${address}`);
        const data = await response.json();

        console.log('📦 [TokenCheck] API response', data);

        if (!response.ok) {
          console.error('❌ [TokenCheck] API error', data);
          setPromiseHolderStatus(false);
          setStatusMessage('Check failed, proceeding anyway...');
          setTimeout(() => setCurrentStep('mint-choice'), 1000);
          return;
        }

        const hasPromise = data.holds === true;
        console.log('✅ [TokenCheck] Holdings check complete', {
          holds: hasPromise,
          balance: data.balance,
          debug: data.debug,
        });

        setPromiseHolderStatus(hasPromise);
        setStatusMessage(hasPromise ? '✓ Found A Promise!' : 'No Promise found');
        setIsChecking(false);

        setTimeout(() => setCurrentStep('mint-choice'), 800);
      } catch (error: any) {
        console.error('💥 [TokenCheck] Unexpected error', {
          error: error.message,
          stack: error.stack,
        });
        setPromiseHolderStatus(false);
        setStatusMessage('Check failed, proceeding anyway...');
        setTimeout(() => setCurrentStep('mint-choice'), 1000);
      }
    };

    checkHoldings();
  }, [address, chain, setCurrentStep, setPromiseHolderStatus]);

  const handleSwitchNetwork = () => {
    const targetChainId = PROMISE_CHAIN_ID || mainnet.id;
    console.log('🔄 [TokenCheck] User requested network switch', { targetChainId });
    if (switchChain) {
      switchChain({ chainId: targetChainId });
      alreadyHandledRef.current = false;
      setIsChecking(true);
      setStatusMessage('Looking for A Promise...');
    }
  };

  const targetChainId = PROMISE_CHAIN_ID || mainnet.id;
  const switchButtonText = targetChainId === 1337 ? 'Switch to Local' : 
                          targetChainId === 11155111 ? 'Switch to Sepolia' : 
                          'Switch to Mainnet';

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-3xl font-bold mb-6 jacquard-12">Checking your fate...</div>

        {needsNetworkSwitch ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-yellow-400 text-3xl jacquard-12">{statusMessage}</div>
            <button
              onClick={handleSwitchNetwork}
              className="px-8 py-4 text-3xl border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 jacquard-12"
            >
              {switchButtonText}
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
    </div>
  );
}
