import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose server env vars to the client bundle so client components can read them
  env: {
    NEXT_PUBLIC_PROMISE_CONTRACT: process.env.PROMISE_CONTRACT,
    NEXT_PUBLIC_PROMISE_TOKEN_ID: process.env.PROMISE_TOKEN_ID,
  },
};

export default nextConfig;
