'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DataFreshnessIndicatorProps {
  data: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showDetails?: boolean;
}

export default function DataFreshnessIndicator({ 
  data, 
  onRefresh, 
  isRefreshing = false,
  showDetails = true 
}: DataFreshnessIndicatorProps) {
  const [freshnessInfo, setFreshnessInfo] = useState<{
    lastUpdated: Date | null;
    latestDataDate: Date | null;
    daysBehind: number;
    isStale: boolean;
    warning: string | null;
  }>({
    lastUpdated: null,
    latestDataDate: null,
    daysBehind: 0,
    isStale: false,
    warning: null
  });

  useEffect(() => {
    if (!data) return;

    const now = new Date();
    let lastUpdated = data.fetched_at ? new Date(data.fetched_at) : null;
    let latestDataDate: Date | null = null;
    let warning: string | null = null;

    // Check Search Console data freshness
    if (data.search_console?.byDate && Array.isArray(data.search_console.byDate)) {
      const dates = data.search_console.byDate
        .map((item: any) => {
          const dateStr = item.keys?.[0] || item.date;
          return dateStr ? new Date(dateStr) : null;
        })
        .filter(Boolean)
        .sort((a: Date, b: Date) => b.getTime() - a.getTime());

      if (dates.length > 0) {
        latestDataDate = dates[0];
      }
    }

    // Check Analytics data freshness
    if (data.analytics?.summary && !latestDataDate) {
      // Analytics typically has more recent data
      latestDataDate = new Date();
      latestDataDate.setDate(latestDataDate.getDate() - 1); // Usually 1 day behind
    }

    // Calculate days behind
    let daysBehind = 0;
    if (latestDataDate) {
      daysBehind = Math.floor((now.getTime() - latestDataDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Determine if data is stale
    const isStale = daysBehind > 4; // Consider stale if more than 4 days old

    // Set appropriate warnings
    if (daysBehind > 7) {
      warning = `Data is ${daysBehind} days old. Consider refreshing for more recent insights.`;
    } else if (daysBehind > 4) {
      warning = `Data is ${daysBehind} days behind. This may be normal for Search Console.`;
    } else if (daysBehind >= 2 && daysBehind <= 3) {
      // This is normal for Search Console
      warning = null;
    }

    // Check if CTR is 0 with impressions
    if (data.search_console?.summary) {
      const { clicks, impressions, ctr } = data.search_console.summary;
      if (impressions > 0 && ctr === 0 && clicks === 0) {
        warning = 'No clicks recorded despite impressions. Check your site\'s search performance.';
      } else if (impressions > 0 && ctr === 0 && clicks > 0) {
        warning = 'CTR calculation error detected. Data may need refresh.';
      }
    }

    setFreshnessInfo({
      lastUpdated,
      latestDataDate,
      daysBehind,
      isStale,
      warning
    });
  }, [data]);

  const getStatusIcon = () => {
    if (freshnessInfo.isStale) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    if (freshnessInfo.daysBehind <= 3) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-blue-500" />;
  };

  const getStatusBadge = () => {
    if (freshnessInfo.isStale) {
      return <Badge variant="outline" className="text-yellow-600">Needs Refresh</Badge>;
    }
    if (freshnessInfo.daysBehind <= 3) {
      return <Badge variant="outline" className="text-green-600">Fresh Data</Badge>;
    }
    return <Badge variant="outline" className="text-blue-600">Recent Data</Badge>;
  };

  const formatTimeDifference = (date: Date | null) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm text-gray-600">
            Data freshness
          </span>
          {getStatusBadge()}
        </div>
        
        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>

      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          {freshnessInfo.lastUpdated && (
            <div className="flex items-center gap-4">
              <span>Last updated: {formatTimeDifference(freshnessInfo.lastUpdated)}</span>
              {freshnessInfo.latestDataDate && (
                <span>Latest data: {freshnessInfo.latestDataDate.toLocaleDateString()}</span>
              )}
            </div>
          )}
          
          {freshnessInfo.daysBehind >= 2 && freshnessInfo.daysBehind <= 3 && (
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>Search Console typically has a 2-3 day data delay</span>
            </div>
          )}
        </div>
      )}

      {freshnessInfo.warning && (
        <Alert className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {freshnessInfo.warning}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function DataFreshnessCompact({ data }: { data: any }) {
  const [daysBehind, setDaysBehind] = useState(0);

  useEffect(() => {
    if (!data?.search_console?.byDate) return;

    const dates = data.search_console.byDate
      .map((item: any) => {
        const dateStr = item.keys?.[0] || item.date;
        return dateStr ? new Date(dateStr) : null;
      })
      .filter(Boolean)
      .sort((a: Date, b: Date) => b.getTime() - a.getTime());

    if (dates.length > 0) {
      const latestDate = dates[0];
      const now = new Date();
      const days = Math.floor((now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
      setDaysBehind(days);
    }
  }, [data]);

  const getColor = () => {
    if (daysBehind > 4) return 'text-yellow-600';
    if (daysBehind <= 3) return 'text-green-600';
    return 'text-blue-600';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`flex items-center gap-1 text-xs ${getColor()}`}>
            <Clock className="h-3 w-3" />
            <span>{daysBehind}d</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Data is {daysBehind} days behind</p>
          {daysBehind >= 2 && daysBehind <= 3 && (
            <p className="text-xs text-gray-400">This is normal for Search Console</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}