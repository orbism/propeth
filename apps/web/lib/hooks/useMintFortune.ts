import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect, useState } from 'react';
import { Address, decodeEventLog } from 'viem';
import { FORTUNE721_ADDRESS, FORTUNE721_ABI } from '../contracts';
import { useAppStore, triptychIdsToBigInt } from '../store';

export function useMintFortune() {
  const { setCurrentStep, setFortuneTokenId } = useAppStore();
  const [userError, setUserError] = useState<string | null>(null);
  
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Debug: Log state changes
  useEffect(() => {
    if (hash) {
      console.log('[useMintFortune] State:', {
        hash: hash.slice(0, 10),
        isConfirming,
        isSuccess,
        hasReceipt: !!receipt,
        receiptLogs: receipt?.logs.length || 0,
      });
    }
  }, [hash, isConfirming, isSuccess, receipt]);

  const mintFortune = () => {
    setUserError(null); // Clear previous error

    // Read directly from store to avoid stale closure values
    const currentTriptychIds = useAppStore.getState().triptychIds;
    const triptychIds = triptychIdsToBigInt(currentTriptychIds);

    console.log('[useMintFortune] Store triptychIds:', currentTriptychIds);
    console.log('[useMintFortune] Converted to bigints:', triptychIds?.map(id => id.toString()));

    if (!triptychIds || triptychIds.length !== 3) {
      console.error('[useMintFortune] ❌ Invalid triptych IDs:', triptychIds);
      setUserError('No cards selected. Please go back and try again.');
      return;
    }

    // Check for duplicates before calling contract
    const uniqueIds = new Set(triptychIds.map(id => id.toString()));
    if (uniqueIds.size !== 3) {
      console.error('[useMintFortune] ❌ Duplicate card IDs detected:', triptychIds.map(id => id.toString()));
      setUserError('Duplicate cards detected. This is a bug - please restart the flow.');
      return;
    }

    console.log('[useMintFortune] 🔮 Minting fortune with cards:', triptychIds.map(id => id.toString()));

    writeContract({
      address: FORTUNE721_ADDRESS as Address,
      abi: FORTUNE721_ABI,
      functionName: 'mintFromTriptych',
      args: [triptychIds as [bigint, bigint, bigint]],
      gas: BigInt(2000000),
    });
  };

  // When fortune is minted, check status and extract token ID
  useEffect(() => {
    // Only process when we have receipt
    if (!receipt || isConfirming) return;

    console.log('[useMintFortune] Processing receipt:', {
      status: receipt.status,
      logsCount: receipt.logs.length,
    });

    // Check if transaction reverted on-chain
    if (receipt.status === 'reverted') {
      console.error('[useMintFortune] ❌ Transaction reverted on-chain');
      setUserError('Transaction failed on-chain. The cards may not match what the contract expects. Please try again.');
      return;
    }

    // Transaction succeeded - extract token ID
    if (receipt.status === 'success' && receipt.logs && receipt.logs.length > 0) {
      try {
        const transferEvent = receipt.logs.find(log =>
          log.address.toLowerCase() === FORTUNE721_ADDRESS.toLowerCase() &&
          log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        );

        if (transferEvent && transferEvent.topics[3]) {
          const tokenId = BigInt(transferEvent.topics[3]);
          console.log('[useMintFortune] ✅ Setting token ID:', tokenId.toString());
          setFortuneTokenId(tokenId);
          setCurrentStep('complete');
        } else {
          console.log('[useMintFortune] No Transfer event, using token ID 0');
          setFortuneTokenId(BigInt(0));
          setCurrentStep('complete');
        }
      } catch (error) {
        console.error('[useMintFortune] Error parsing:', error);
        setFortuneTokenId(BigInt(0));
        setCurrentStep('complete');
      }
    }
  }, [receipt, isConfirming, setCurrentStep, setFortuneTokenId]);

  // Handle write errors and decode them
  useEffect(() => {
    if (writeError) {
      console.error('[useMintFortune] ❌ Transaction error:', writeError);

      // Try to decode common errors
      const errorMessage = writeError.message || '';
      if (errorMessage.includes('DuplicateCardsInTriptych') || errorMessage.includes('0x6d8240e8')) {
        setUserError('Cannot create fortune: duplicate cards detected. Please restart and try again.');
      } else if (errorMessage.includes('InvalidCardId')) {
        setUserError('Invalid card ID. Please restart and try again.');
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        setUserError('Transaction cancelled.');
      } else {
        setUserError('Transaction failed. Please try again.');
      }
    }
  }, [writeError]);

  // Determine if transaction failed (either write error or on-chain revert)
  const isReverted = receipt?.status === 'reverted';
  const hasFailed = !!writeError || isReverted || !!userError;

  return {
    mintFortune,
    isPending: isWritePending || isConfirming,
    isSuccess: receipt?.status === 'success',
    isReverted,
    hasFailed,
    error: writeError,
    userError, // Human-readable error message
    hash,
    receipt,
  };
}