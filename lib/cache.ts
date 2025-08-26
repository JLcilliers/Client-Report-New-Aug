export const cacheConfig = {
  // Cache times in seconds
  api: {
    analytics: 300, // 5 minutes
    searchConsole: 300, // 5 minutes
    pageSpeed: 3600, // 1 hour
  },
  static: {
    images: 86400, // 24 hours
    css: 86400, // 24 hours
    js: 86400, // 24 hours
  },
  reports: {
    client: 60, // 1 minute for live updates
    internal: 300, // 5 minutes
  }
};

export function getCacheHeaders(type: keyof typeof cacheConfig, subtype: string) {
  const maxAge = (cacheConfig[type] as any)?.[subtype] || 0;
  return {
    'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
  };
}