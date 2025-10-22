/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
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
          hostname: 'ipfs.io',
        },
        {
          protocol: 'https',
          hostname: '**.ipfs.dweb.link',
        },
      ],
    },
  };
  
  module.exports = nextConfig;