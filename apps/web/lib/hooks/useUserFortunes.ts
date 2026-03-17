import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { FORTUNE721_ADDRESS, FORTUNE721_ABI, PACK1155_ADDRESS, PACK1155_ABI } from '@/lib/contracts';
import { parseAbiItem } from 'viem';
import { debug } from '../debug';

export interface FortuneReading {
  tokenId: string;
  cardIds: [string, string, string];
  variants: [string, string, string];
  blockNumber: string;
}

export interface UnfinishedReading {
  cardIds: [string, string, string];
}

export function useUserFortunes() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [fortunes, setFortunes] = useState<FortuneReading[]>([]);
  const [unfinishedReading, setUnfinishedReading] = useState<UnfinishedReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !publicClient) {
      setFortunes([]);
      setUnfinishedReading(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        debug.log('[useUserFortunes] Fetching data for:', address);

        // Check for unfinished reading first
        const [hasMintedPack, fortuneCreatedFromLastThree] = await Promise.all([
          publicClient.readContract({
            address: PACK1155_ADDRESS,
            abi: PACK1155_ABI,
            functionName: 'hasMintedPack',
            args: [address],
          }),
          publicClient.readContract({
            address: FORTUNE721_ADDRESS,
            abi: FORTUNE721_ABI,
            functionName: 'fortuneCreatedFromLastThree',
            args: [address],
          }),
        ]);

        debug.log('[useUserFortunes] hasMintedPack:', hasMintedPack, 'fortuneCreated:', fortuneCreatedFromLastThree);

        // If has cards but no fortune from them, fetch the card IDs from contract
        if (hasMintedPack && !fortuneCreatedFromLastThree) {
          debug.log('[useUserFortunes] User has unfinished reading, fetching card IDs from contract');

          // Use getLastThreeCardsMinted to get the exact cards the contract expects
          const lastThreeCards = await publicClient.readContract({
            address: PACK1155_ADDRESS,
            abi: PACK1155_ABI,
            functionName: 'getLastThreeCardsMinted',
            args: [address],
          }) as [bigint, bigint, bigint];

          debug.log('[useUserFortunes] Contract lastThreeCardsMinted:', lastThreeCards.map(String));

          // Check if cards are valid (not all zeros)
          if (lastThreeCards[0] !== BigInt(0) || lastThreeCards[1] !== BigInt(0) || lastThreeCards[2] !== BigInt(0)) {
            const cardIds: [string, string, string] = [
              lastThreeCards[0].toString(),
              lastThreeCards[1].toString(),
              lastThreeCards[2].toString(),
            ];
            setUnfinishedReading({ cardIds });
          } else {
            debug.log('[useUserFortunes] lastThreeCardsMinted returned zeros, no unfinished reading');
            setUnfinishedReading(null);
          }
        } else {
          setUnfinishedReading(null);
        }

        // Query FortuneMinted events for completed readings
        const logs = await publicClient.getLogs({
          address: FORTUNE721_ADDRESS,
          event: parseAbiItem('event FortuneMinted(address indexed to, uint256 indexed tokenId, uint256[3] cardIds, uint256[3] variants)'),
          args: {
            to: address,
          },
          fromBlock: BigInt(0),
          toBlock: 'latest',
        });

        debug.log('[useUserFortunes] Found', logs.length, 'fortune events');

        // Parse logs into FortuneReading objects (convert bigints to strings)
        const readings: FortuneReading[] = logs.map((log) => {
          const cardIds = log.args.cardIds as [bigint, bigint, bigint];
          const variants = log.args.variants as [bigint, bigint, bigint];
          return {
            tokenId: log.args.tokenId!.toString(),
            cardIds: [cardIds[0].toString(), cardIds[1].toString(), cardIds[2].toString()] as [string, string, string],
            variants: [variants[0].toString(), variants[1].toString(), variants[2].toString()] as [string, string, string],
            blockNumber: log.blockNumber.toString(),
          };
        });

        // Sort by block number descending (newest first)
        readings.sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)));

        setFortunes(readings);
      } catch (err) {
        debug.error('[useUserFortunes] Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address, publicClient]);

  return {
    fortunes,
    unfinishedReading,
    isLoading,
    error,
    hasReadings: fortunes.length > 0,
    hasUnfinishedReading: unfinishedReading !== null,
  };
}
