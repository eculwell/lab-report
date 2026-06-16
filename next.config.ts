import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: process.env.MINIO_ENDPOINT ?? 'minio',
        port: process.env.MINIO_PORT ?? '9000',
      },
    ],
  },
};

export default nextConfig;
