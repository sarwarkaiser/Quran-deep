/** @type {import('next').NextConfig} */
const rawApiBase = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3011";
const apiBase = rawApiBase.endsWith("/v1") ? rawApiBase : `${rawApiBase}/v1`;

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
