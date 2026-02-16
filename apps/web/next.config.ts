import type { NextConfig } from "next";

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphaxai-gateway.onrender.com';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${GATEWAY_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
