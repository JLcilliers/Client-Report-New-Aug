const { withSentryConfig } = require('@sentry/nextjs');

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

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "search-signal", // Replace with your org
    project: "search-insights-hub", // Replace with your project
    
    // Use tunnel to avoid ad blockers
    tunnelRoute: "/monitoring",
    
    // Automatically instrument Next.js data fetching
    autoInstrumentServerFunctions: true,
    autoInstrumentAppDirectory: true,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: false,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
    // This can increase your server load as well as your hosting bill.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  }
);