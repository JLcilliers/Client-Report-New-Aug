import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ensure TypeScript is properly configured during build
    tsconfigPath: './tsconfig.json',
  },
  experimental: { 
    instrumentationHook: true 
  },
  images: {
    domains: ['localhost', 'online-client-reporting.vercel.app'],
  },
  webpack: (config, { isServer }) => {
    // Fix for module resolution in Vercel
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': new URL('.', import.meta.url).pathname.replace(/\/$/, ''),
    };
    return config;
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

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withSentryConfig(
  bundleAnalyzer(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    
    // Source maps upload configuration
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: process.env.SENTRY_ORG || "search-signal",
    project: process.env.SENTRY_PROJECT || "search-insights-hub",
    
    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
    tunnelRoute: "/error-monitoring",
    
    // Hides source maps from generated client bundles
    hideSourceMaps: true,
    
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
    
    // Upload a larger set of source maps for prettier stack traces
    widenClientFileUpload: true,
    
    // Automatically instrument your app
    autoInstrumentServerFunctions: true,
    autoInstrumentAppDirectory: true,
  }
);