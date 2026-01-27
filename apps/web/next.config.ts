import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Expose server env vars to the client bundle so client components can read them
  env: {
    NEXT_PUBLIC_PROMISE_CONTRACT: process.env.PROMISE_CONTRACT,
    NEXT_PUBLIC_PROMISE_TOKEN_ID: process.env.PROMISE_TOKEN_ID,
  },
  
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'propeth.4everland.link',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.dweb.link',
      },
    ],
  },
};

export default nextConfig;
