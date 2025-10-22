'use client';

interface MintLoaderProps {
  status: 'pending' | 'confirming' | 'success' | 'error';
  txHash?: `0x${string}`;
  error?: Error | null;
}

export function MintLoader({ status, txHash, error }: MintLoaderProps) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="text-center">
        {status === 'pending' && (
          <>
            <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-xl">Waiting for signature...</p>
          </>
        )}

        {status === 'confirming' && (
          <>
            <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-xl mb-2">Confirming transaction...</p>
            {txHash && (
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white underline"
              >
                View on Etherscan
              </a>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✓</div>
            <p className="text-xl">Transaction confirmed!</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">✕</div>
            <p className="text-xl mb-2">Transaction failed</p>
            {error && <p className="text-sm text-red-400">{error.message}</p>}
          </>
        )}
      </div>
    </div>
  );
}