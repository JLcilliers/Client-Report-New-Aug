/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'online-client-reporting.vercel.app'],
  },
  async redirects() {
    return [
      {
        source: '/admin/connections',
        destination: '/admin/google-accounts',
        permanent: true,          // 308 on Vercel
      },
      {
        source: '/admin/connections/:path*',
        destination: '/admin/google-accounts/:path*',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig