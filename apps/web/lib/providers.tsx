'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from './wagmi';
import { ReactNode, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Shorter cache times for local dev to prevent stale block refs
        gcTime: process.env.NODE_ENV === 'development' ? 1000 * 30 : 1000 * 60 * 60 * 24,
        staleTime: process.env.NODE_ENV === 'development' ? 1000 * 5 : 1000 * 60,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  // Dev helper: expose cache clear function
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).clearWagmiCache = () => {
      queryClient.clear();
      console.log('✅ Wagmi cache cleared');
    };
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}