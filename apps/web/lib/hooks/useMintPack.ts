import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, usePublicClient } from 'wagmi';
import { PACK1155_ADDRESS, PACK1155_ABI, PRICE_PER_PACK } from '@/lib/contracts';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { decodeEventLog, Address } from 'viem';

export function useMintPack() {
  const { setTriptychIds, setPackTxHash, setCurrentStep } = useAppStore();
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const [balanceCheckAttempts, setBalanceCheckAttempts] = useState(0);

  // Get current price from contract
  const { data: contractPrice } = useReadContract({
    address: PACK1155_ADDRESS,
    abi: PACK1155_ABI,
    functionName: 'pricePerPack',
  });

  const price = contractPrice || PRICE_PER_PACK;

  // Write contract
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  // Log any write errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ [useMintPack] Write contract error:', writeError);
    }
  }, [writeError]);

  // Wait for receipt (with confirmations for local chains)
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  // Helper: Query balances for all card IDs and find newly minted ones
  const queryBalancesFallback = async (toAddress: Address): Promise<readonly [bigint, bigint, bigint] | null> => {
    if (!publicClient) return null;
    
    console.log('🔍 [useMintPack] Querying balances as fallback...');
    
    try {
      const balancePromises = Array.from({ length: 15 }, (_, i) => 
        publicClient.readContract({
          address: PACK1155_ADDRESS,
          abi: PACK1155_ABI,
          functionName: 'balanceOf',
          args: [toAddress, BigInt(i)],
        })
      );

      const balances = await Promise.all(balancePromises);
      const ownedCards: bigint[] = [];
      
      balances.forEach((balance, id) => {
        if (balance && balance > BigInt(0)) {
          ownedCards.push(BigInt(id));
          console.log(`  ✅ Card ${id}: balance = ${balance.toString()}`);
        }
      });

      if (ownedCards.length >= 3) {
        // Take the last 3 (most recently minted)
        const recentCards = ownedCards.slice(-3) as [bigint, bigint, bigint];
        console.log('✅ [useMintPack] Found cards via balance query:', recentCards.map(id => id.toString()));
        return recentCards;
      }

      console.warn('⚠️ [useMintPack] Not enough cards found in balance query:', ownedCards.length);
      return null;
    } catch (error) {
      console.error('❌ [useMintPack] Balance query failed:', error);
      return null;
    }
  };

  // Extract card IDs from logs when tx confirms - with multiple fallbacks
  useEffect(() => {
    if (isSuccess && receipt && userAddress) {
      console.log('🎫 [useMintPack] Transaction confirmed, parsing logs...', {
        logsCount: receipt.logs.length,
        packAddress: PACK1155_ADDRESS,
        userAddress,
      });

      // Normalize addresses for comparison
      const normalizedPackAddress = PACK1155_ADDRESS.toLowerCase();

      // Strategy 1: Try PackMinted event
      try {
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === normalizedPackAddress) {
            try {
              const decoded = decodeEventLog({
                abi: PACK1155_ABI,
                data: log.data,
                topics: log.topics,
              });

              if (decoded.eventName === 'PackMinted') {
                const ids = (decoded.args as any).ids as readonly [bigint, bigint, bigint];
                
                console.log('✅ [useMintPack] PackMinted event found!', {
                  ids: ids.map(id => id.toString()),
                });

                setTriptychIds(ids);
                setPackTxHash(hash || null);
                setCurrentStep('triptych-display');
                return;
              }
            } catch (e: any) {
              // Continue to next log
            }
          }
        }
        console.warn('⚠️ [useMintPack] PackMinted event not found, trying TransferBatch...');
      } catch (error) {
        console.error('❌ [useMintPack] Error in PackMinted parsing:', error);
      }

      // Strategy 2: Try TransferBatch event (ERC1155 standard event)
      try {
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === normalizedPackAddress) {
            try {
              const decoded = decodeEventLog({
                abi: PACK1155_ABI,
                data: log.data,
                topics: log.topics,
              });

              if (decoded.eventName === 'TransferBatch') {
                const args = decoded.args as any;
                const ids = args.ids as readonly bigint[];
                
                if (ids && ids.length === 3) {
                  console.log('✅ [useMintPack] TransferBatch event found!', {
                    ids: ids.map(id => id.toString()),
                  });

                  setTriptychIds(ids as readonly [bigint, bigint, bigint]);
                  setPackTxHash(hash || null);
                  setCurrentStep('triptych-display');
                  return;
                }
              }
            } catch (e: any) {
              // Continue to next log
            }
          }
        }
        console.warn('⚠️ [useMintPack] TransferBatch event not found, falling back to balance query...');
      } catch (error) {
        console.error('❌ [useMintPack] Error in TransferBatch parsing:', error);
      }

      // Strategy 3: Query balances directly (with retry)
      const attemptBalanceQuery = async (attempt: number = 0) => {
        if (attempt >= 3) {
          console.error('❌ [useMintPack] All strategies failed after 3 attempts');
          return;
        }

        setBalanceCheckAttempts(attempt + 1);
        
        // Add delay for subsequent attempts to let state settle
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const ids = await queryBalancesFallback(userAddress);
        
        if (ids) {
          setTriptychIds(ids);
          setPackTxHash(hash || null);
          setCurrentStep('triptych-display');
        } else if (attempt < 2) {
          console.log(`⏳ [useMintPack] Retry ${attempt + 1}/3...`);
          attemptBalanceQuery(attempt + 1);
        }
      };

      attemptBalanceQuery();
    }
  }, [isSuccess, receipt, hash, userAddress, publicClient, setTriptychIds, setPackTxHash, setCurrentStep]);

  const mintPack = (address: `0x${string}`) => {
    console.log('🎫 [useMintPack] Minting pack', {
      to: address,
      contract: PACK1155_ADDRESS,
      price: price.toString(),
    });
    
    if (!PACK1155_ADDRESS) {
      console.error('❌ [useMintPack] PACK1155_ADDRESS is empty!');
      return;
    }
    
    setCurrentStep('minting');
    
    const txParams = {
      address: PACK1155_ADDRESS,
      abi: PACK1155_ABI,
      functionName: 'mintPack' as const,
      args: [address] as const,
      value: price,
      gas: BigInt(500000), // Explicit gas limit to prevent OutOfGas
    };
    
    console.log('[useMintPack] Submitting transaction with gas:', txParams.gas?.toString());
    
    writeContract(txParams);
  };

  return {
    mintPack,
    isPending: isWritePending || isConfirming,
    isSuccess,
    error: writeError,
    hash,
    price,
  };
}