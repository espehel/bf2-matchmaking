/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@bf2-matchmaking/supabase',
    '@bf2-matchmaking/types',
    '@bf2-matchmaking/utils',
  ],
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
