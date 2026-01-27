import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { metaMask, coinbaseWallet } from 'wagmi/connectors';

// Define custom local chain with ID 1337 (not 31337)
const localhost = defineChain({
  id: 1337,
  name: 'Localhost 8545',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
});

// RPC transports - use NEXT_PUBLIC_ prefixed keys for client-side access
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY || '';
const infuraKey = process.env.NEXT_PUBLIC_INFURA_KEY || '';

// Public RPC fallbacks (no API key required)
const getSepoliaRpc = () => {
  if (infuraKey) return `https://sepolia.infura.io/v3/${infuraKey}`;
  if (alchemyKey) return `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
  return 'https://ethereum-sepolia-rpc.publicnode.com'; // Free public RPC
};

const getMainnetRpc = () => {
  if (infuraKey) return `https://mainnet.infura.io/v3/${infuraKey}`;
  if (alchemyKey) return `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
  return 'https://ethereum-rpc.publicnode.com'; // Free public RPC
};

// Determine which chains to use based on environment
const isDev = process.env.NODE_ENV === 'development';
const chains = isDev ? [localhost, mainnet, sepolia] : [mainnet, sepolia];

export const config = createConfig({
  chains: chains as any,
  connectors: [
    // MetaMask specific - NO API KEY NEEDED
    metaMask(),

    // Coinbase Wallet - NO API KEY NEEDED
    coinbaseWallet({
      appName: 'Bezmiar Fortune Teller',
    }),
  ],
  transports: {
    [localhost.id]: http('http://127.0.0.1:8545'),
    [mainnet.id]: http(getMainnetRpc()),
    [sepolia.id]: http(getSepoliaRpc()),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}