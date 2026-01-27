import { useAccount, usePublicClient } from 'wagmi';
import { useState } from 'react';
import { PACK1155_ADDRESS, PACK1155_ABI, FORTUNE721_ADDRESS, FORTUNE721_ABI } from '../contracts';
import { useAppStore } from '../store';

export function useCheckExistingProgress() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { setTriptychIds, setFortuneTokenId, setCurrentStep } = useAppStore();
  const [isChecking, setIsChecking] = useState(false);

  const checkProgress = async (): Promise<'none' | 'cards' | 'fortune'> => {
    if (!address || !publicClient) {
      console.log('[useCheckExistingProgress] No address or client');
      return 'none';
    }

    if (isChecking) {
      console.log('[useCheckExistingProgress] Already checking');
      return 'none';
    }

    setIsChecking(true);
    console.log('[useCheckExistingProgress] Checking progress for:', address);

    try {
      // Check 1: Has user minted a pack?
      const hasMintedPack = await publicClient.readContract({
        address: PACK1155_ADDRESS,
        abi: PACK1155_ABI,
        functionName: 'hasMintedPack',
        args: [address],
      });

      console.log('[useCheckExistingProgress] hasMintedPack:', hasMintedPack);

      // STATE A: No cards minted → Go to promise check (token-check)
      if (!hasMintedPack) {
        console.log('[useCheckExistingProgress] User has no pack minted → token-check');
        setIsChecking(false);
        return 'none';
      }

      // STATE B/C/D: User has minted cards → Check if fortune was created
      const fortuneCreatedFromLastThree = await publicClient.readContract({
        address: FORTUNE721_ADDRESS,
        abi: FORTUNE721_ABI,
        functionName: 'fortuneCreatedFromLastThree',
        args: [address],
      });

      console.log('[useCheckExistingProgress] fortuneCreatedFromLastThree:', fortuneCreatedFromLastThree);

      // STATE D: Fortune was created from last three cards → Go to promise check (reset)
      if (fortuneCreatedFromLastThree) {
        console.log('[useCheckExistingProgress] Fortune already created → token-check (reset)');
        setIsChecking(false);
        return 'fortune'; // Signals that they should start new batch
      }

      // STATE B: Cards minted but no fortune yet → Show triptych to create fortune
      // Note: We don't query the card IDs here - TriptychDisplay will handle fetching them
      console.log('[useCheckExistingProgress] Cards minted, no fortune yet → triptych-display');
      setCurrentStep('triptych-display');
      setIsChecking(false);
      return 'cards';
      
    } catch (error) {
      console.error('[useCheckExistingProgress] Error checking progress:', error);
      setIsChecking(false);
      return 'none';
    }
  };

  return {
    checkProgress,
    isChecking,
  };
}