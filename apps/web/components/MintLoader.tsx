'use client';

import { ModalFrame } from './ui/ModalFrame';

interface MintLoaderProps {
  status: 'pending' | 'confirming' | 'success' | 'error';
  txHash?: `0x${string}`;
  error?: Error | null;
  onClose?: () => void;
}

export function MintLoader({ status, txHash, error, onClose }: MintLoaderProps) {
  const chainId = typeof window !== 'undefined' ? 
    (window as any).ethereum?.chainId : null;
  const isLocal = chainId === '0x539'; // 1337 in hex

  return (
    <ModalFrame isOpen={true}>
      <div className="text-center min-h-[200px] flex flex-col items-center justify-center">
        {status === 'pending' && (
          <>
            <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-2xl">Awaiting Signature...</p>
            <p className="text-xl text-gray-400 mt-2">Check your wallet</p>
          </>
        )}

        {status === 'confirming' && (
          <>
            <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-2xl mb-2">Confirming...</p>
            {txHash && !isLocal && (
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white underline mt-2"
              >
                View Transaction
              </a>
            )}
            {isLocal && (
              <p className="text-sm text-gray-400 mt-2">Transaction pending on local chain...</p>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✓</div>
            <p className="text-2xl">Success!</p>
            <p className="text-sm text-gray-400 mt-2">Transaction confirmed</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4 text-red-500">✕</div>
            <p className="text-2xl mb-2">Failed</p>
            {error && (
              <p className="text-sm text-red-400 mt-2 max-w-sm break-words">
                {error.message}
              </p>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="mt-6 px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-black transition-all"
              >
                Close
              </button>
            )}
          </>
        )}
      </div>
    </ModalFrame>
  );
}