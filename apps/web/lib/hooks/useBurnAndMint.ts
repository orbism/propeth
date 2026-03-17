import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient, useReadContract } from 'wagmi';
import { BURN_GATEWAY_ADDRESS, BURN_GATEWAY_ABI, PACK1155_ADDRESS, PACK1155_ABI } from '@/lib/contracts';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Address } from 'viem';
import { debug } from '../debug';

// ERC721 setApprovalForAll ABI
const ERC721_ABI = [
  {
    type: 'function',
    name: 'setApprovalForAll',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

export function useBurnAndMint() {
  const { setTriptychIds, setPackTxHash, setCurrentStep, currentStep } = useAppStore();
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();

  const [promiseNft, setPromiseNft] = useState<Address | undefined>();
  const [tokenId, setTokenId] = useState<bigint | undefined>();
  const [phase, setPhase] = useState<'idle' | 'approval' | 'burn'>('idle');
  const [burnCompleted, setBurnCompleted] = useState(false);
  const [burnTxSent, setBurnTxSent] = useState(false); // Track if burn tx was sent

  // Get the adapter address for the promise NFT from the gateway
  const { data: adapterAddress, error: adapterError, isLoading: adapterLoading } = useReadContract({
    address: BURN_GATEWAY_ADDRESS,
    abi: BURN_GATEWAY_ABI,
    functionName: 'adapters',
    args: promiseNft ? [promiseNft] : undefined,
    query: {
      enabled: !!promiseNft && !!BURN_GATEWAY_ADDRESS,
    },
  });

  // Debug: Log adapter lookup status
  useEffect(() => {
    if (promiseNft) {
      debug.log('[useBurnAndMint] 🔍 Adapter lookup:', {
        gateway: BURN_GATEWAY_ADDRESS,
        promiseNft,
        adapterAddress,
        adapterError: adapterError?.message,
        adapterLoading,
        isZeroAddress: adapterAddress === '0x0000000000000000000000000000000000000000',
      });

      if (!BURN_GATEWAY_ADDRESS) {
        debug.error('[useBurnAndMint] ❌ BURN_GATEWAY_ADDRESS is not configured!');
      }
      if (adapterAddress === '0x0000000000000000000000000000000000000000') {
        debug.error('[useBurnAndMint] ❌ No adapter registered for Promise NFT in gateway!');
        debug.error('   You need to call gateway.setAdapter(promiseNft, adapterAddress) on the contract');
      }
    }
  }, [promiseNft, adapterAddress, adapterError, adapterLoading]);

  // Check if ADAPTER is approved for the token (not gateway!)
  const { data: approvedAddress, isLoading: approvalLoading } = useReadContract({
    address: promiseNft,
    abi: ERC721_ABI,
    functionName: 'isApprovedForAll',
    args: userAddress && adapterAddress ? [userAddress, adapterAddress] : undefined,
    query: {
      enabled: !!(promiseNft && userAddress && adapterAddress && adapterAddress !== '0x0000000000000000000000000000000000000000'),
    },
  });

  // Write contract (for both approval and burn)
  const {
    writeContract,
    reset: resetWriteContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  // Wait for receipt (either approval or burn transaction)
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  // Debug: Log writeContract errors
  useEffect(() => {
    if (writeError) {
      debug.error('[useBurnAndMint] ❌ Write contract error:', writeError.message);
    }
  }, [writeError]);

  // Helper: Query lastThreeCardsMinted directly from Pack1155
  const queryLastThreeCards = async (userAddress: Address) => {
    debug.log('🔍 [useBurnAndMint] Querying lastThreeCardsMinted for address:', userAddress);
    
    try {
      const cards = await publicClient.readContract({
        address: PACK1155_ADDRESS,
        abi: PACK1155_ABI,
        functionName: 'getLastThreeCardsMinted',
        args: [userAddress],
      });
      return cards as readonly [bigint, bigint, bigint];
    } catch (error) {
      debug.error('NOPE [useBurnAndMint] Failed to query lastThreeCardsMinted:', error);
      return null;
    }
  };

  // Extract card IDs when burn tx confirms - ONLY after actual burn tx (not approval)
  useEffect(() => {
    // Must have successful tx with receipt
    if (!isSuccess || !receipt || !userAddress) return;
    // Must be in burn phase with burn tx actually sent
    if (phase !== 'burn' || !burnTxSent) return;
    // Don't re-process
    if (burnCompleted) return;
    // Make sure this receipt is for the burn tx, not approval
    // Check for PackMinted event from Pack1155
    const hasPackMintedEvent = receipt.logs.some(log =>
      log.address.toLowerCase() === PACK1155_ADDRESS.toLowerCase()
    );

    if (!hasPackMintedEvent) {
      debug.log('[useBurnAndMint] Receipt has no PackMinted event, waiting for burn tx...');
      return;
    }

    debug.log('[useBurnAndMint] ✅ Burn tx confirmed with PackMinted event, querying cards...');
    setBurnCompleted(true);

    (async () => {
      // Small delay for state sync
      await new Promise(resolve => setTimeout(resolve, 500));

      const cards = await queryLastThreeCards(userAddress);
      if (cards && (cards[0] !== BigInt(0) || cards[1] !== BigInt(0) || cards[2] !== BigInt(0))) {
        debug.log('[useBurnAndMint] ✅ Got cards:', cards.map(id => id.toString()));
        // Convert bigints to strings for store
        const stringIds: readonly [string, string, string] = [
          cards[0].toString(),
          cards[1].toString(),
          cards[2].toString(),
        ] as const;
        setTriptychIds(stringIds);
        setCurrentStep('triptych-display');
      } else {
        debug.error('[useBurnAndMint] ❌ Cards query returned zeros or failed');
        setCurrentStep('landing');
      }
    })();
  }, [isSuccess, receipt, userAddress, phase, burnTxSent, burnCompleted, setTriptychIds, setCurrentStep, publicClient]);

  // Phase 1: Check approval and request if needed (only when idle)
  useEffect(() => {
    if (!promiseNft || tokenId === undefined || !userAddress) return;
    if (currentStep !== 'minting' || phase !== 'idle') return;
    if (isWritePending || isConfirming) return;

    // Check for missing gateway configuration
    if (!BURN_GATEWAY_ADDRESS) {
      debug.error('[useBurnAndMint] ❌ Cannot proceed: BURN_GATEWAY_ADDRESS not configured');
      return;
    }

    // Still loading adapter
    if (adapterLoading) {
      debug.log('[useBurnAndMint] ⏳ Waiting for adapter lookup...');
      return;
    }

    // No adapter registered
    if (!adapterAddress || adapterAddress === '0x0000000000000000000000000000000000000000') {
      debug.error('[useBurnAndMint] ❌ Cannot proceed: No adapter registered for Promise NFT');
      return;
    }

    // Still checking approval status
    if (approvalLoading) {
      debug.log('[useBurnAndMint] ⏳ Waiting for approval check...');
      return;
    }

    const isApproved = approvedAddress === true;
    debug.log('[useBurnAndMint] 🔍 Phase check - approved:', isApproved, 'adapter:', adapterAddress, 'approvalLoading:', approvalLoading);

    if (!isApproved) {
      // Need approval first
      debug.log('[useBurnAndMint] 📝 Phase 1: Requesting approval for adapter');
      setPhase('approval');

      writeContract({
        address: promiseNft,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [adapterAddress, true],
      });
    } else {
      // Already approved, go straight to burn
      debug.log('[useBurnAndMint] ✅ Already approved, transitioning to burn phase');
      setPhase('burn');
    }
  }, [promiseNft, adapterAddress, adapterLoading, tokenId, userAddress, currentStep, phase, isWritePending, isConfirming, approvedAddress, approvalLoading, writeContract]);

  // Phase 2: Send burn tx when phase becomes 'burn'
  useEffect(() => {
    if (phase !== 'burn') return;
    if (burnTxSent) return; // Already sent
    if (isWritePending || isConfirming) return;
    if (!promiseNft || tokenId === undefined) return;

    debug.log('[useBurnAndMint] 🔥 Phase 2: Sending burn transaction');
    debug.log('[useBurnAndMint] → Gateway:', BURN_GATEWAY_ADDRESS);
    debug.log('[useBurnAndMint] → Promise NFT:', promiseNft);
    debug.log('[useBurnAndMint] → Token ID:', tokenId.toString());

    setBurnTxSent(true);

    writeContract({
      address: BURN_GATEWAY_ADDRESS,
      abi: BURN_GATEWAY_ABI,
      functionName: 'burnAndMintPack',
      args: [promiseNft, tokenId, BigInt(1)],
      gas: BigInt(500_000), // Cap gas to avoid "gas limit too high" errors
    });
  }, [phase, burnTxSent, isWritePending, isConfirming, promiseNft, tokenId, writeContract]);

  // After approval succeeds, move to burn phase
  useEffect(() => {
    if (!isSuccess || !receipt) return;
    if (phase !== 'approval') return;
    if (!promiseNft || !adapterAddress || tokenId === undefined) return;

    // Check for ApprovalForAll event
    const hasApprovalForAllEvent = receipt.logs.some(log =>
      log.address.toLowerCase() === promiseNft.toLowerCase() &&
      log.topics[0] === '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31'
    );

    if (hasApprovalForAllEvent) {
      debug.log('[useBurnAndMint] ✅ Phase 1 complete: Approval confirmed');
      debug.log('[useBurnAndMint] → Transitioning to burn phase...');
      // Reset write state before transitioning
      resetWriteContract();
      setPhase('burn');
    }
  }, [isSuccess, receipt, phase, promiseNft, adapterAddress, tokenId, resetWriteContract]);

  const burnAndMint = (promiseNftAddress: Address, nftTokenId: bigint) => {
    debug.log('[useBurnAndMint] 🚀 Starting burn process');
    debug.log('[useBurnAndMint] → Promise NFT:', promiseNftAddress);
    debug.log('[useBurnAndMint] → Token ID:', nftTokenId.toString());
    debug.log('[useBurnAndMint] → Gateway:', BURN_GATEWAY_ADDRESS);

    if (!BURN_GATEWAY_ADDRESS) {
      debug.error('[useBurnAndMint] ❌ BURN_GATEWAY_ADDRESS is empty!');
      return;
    }

    // Reset everything for a fresh start
    resetWriteContract();
    setBurnCompleted(false);
    setBurnTxSent(false);
    setPhase('idle');

    // Store values and trigger flow
    setPromiseNft(promiseNftAddress);
    setTokenId(nftTokenId);
  };

  return {
    burnAndMint,
    isPending: isWritePending || isConfirming,
    isSuccess,
    error: writeError,
    hash,
    phase, // Expose for debugging
  };
}

