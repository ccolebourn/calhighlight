/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure API proxy to avoid CORS issues in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
