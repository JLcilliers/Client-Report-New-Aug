/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost', 'online-client-reporting.vercel.app'],
  },
}

module.exports = nextConfig