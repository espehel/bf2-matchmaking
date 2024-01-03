/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@bf2-matchmaking/discord',
    '@bf2-matchmaking/logging',
    '@bf2-matchmaking/supabase',
    '@bf2-matchmaking/types',
    '@bf2-matchmaking/utils',
  ],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;
