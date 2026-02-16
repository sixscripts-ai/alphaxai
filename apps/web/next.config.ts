import type { NextConfig } from "next";

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://167.172.22.160:8000';

const nextConfig: NextConfig = {
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
