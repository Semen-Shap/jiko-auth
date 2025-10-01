import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NODE_ENV === 'production' ? 'http://backend:8080/api/v1/:path*' : 'http://localhost:8080/api/v1/:path*';
    return [
      {
        source: '/api/v1/:path*',
        destination: apiUrl,
      },
    ];
  },
};

export default nextConfig;
