import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NODE_ENV === 'production' ? 'http://backend:8080/api/:path*' : 'http://localhost:8080/api/:path*';
    return [
      {
        source: '/api/:path*',
        destination: apiUrl,
      },
    ];
  },
};

export default nextConfig;
