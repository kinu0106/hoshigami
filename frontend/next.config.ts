import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: '/hoshigami/results',
  env: {
    NEXT_PUBLIC_API_URL: 'https://furihaba.net',
  },
};

export default nextConfig;

