import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { FORTUNE721_ADDRESS, FORTUNE721_ABI, PACK1155_ADDRESS, PACK1155_ABI } from '@/lib/contracts';
import { parseAbiItem } from 'viem';

export interface FortuneReading {
  tokenId: bigint;
  cardIds: [bigint, bigint, bigint];
  variants: [bigint, bigint, bigint];
  blockNumber: bigint;
}

export interface UnfinishedReading {
  cardIds: [bigint, bigint, bigint];
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
        console.log('[useUserFortunes] Fetching data for:', address);

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

        console.log('[useUserFortunes] hasMintedPack:', hasMintedPack, 'fortuneCreated:', fortuneCreatedFromLastThree);

        // If has cards but no fortune from them, fetch the card IDs
        if (hasMintedPack && !fortuneCreatedFromLastThree) {
          console.log('[useUserFortunes] User has unfinished reading, fetching card IDs');

          // Query balances for all 15 cards to find which ones they own
          const balancePromises = Array.from({ length: 15 }, (_, i) =>
            publicClient.readContract({
              address: PACK1155_ADDRESS,
              abi: PACK1155_ABI,
              functionName: 'balanceOf',
              args: [address, BigInt(i)],
            })
          );

          const balances = await Promise.all(balancePromises);
          const ownedCards: bigint[] = [];

          balances.forEach((balance, id) => {
            if (balance && balance > BigInt(0)) {
              ownedCards.push(BigInt(id));
            }
          });

          console.log('[useUserFortunes] User owns cards:', ownedCards.map(String));

          // Use the last 3 owned cards (most recently minted)
          if (ownedCards.length >= 3) {
            const cardIds: [bigint, bigint, bigint] = [
              ownedCards[ownedCards.length - 3],
              ownedCards[ownedCards.length - 2],
              ownedCards[ownedCards.length - 1],
            ];
            setUnfinishedReading({ cardIds });
          } else {
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

        console.log('[useUserFortunes] Found', logs.length, 'fortune events');

        // Parse logs into FortuneReading objects
        const readings: FortuneReading[] = logs.map((log) => ({
          tokenId: log.args.tokenId!,
          cardIds: log.args.cardIds as [bigint, bigint, bigint],
          variants: log.args.variants as [bigint, bigint, bigint],
          blockNumber: log.blockNumber,
        }));

        // Sort by block number descending (newest first)
        readings.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        setFortunes(readings);
      } catch (err) {
        console.error('[useUserFortunes] Error fetching data:', err);
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
