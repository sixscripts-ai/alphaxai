import type { NextConfig } from "next";

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://gateway:8000';

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
