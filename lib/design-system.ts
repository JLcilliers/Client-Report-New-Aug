// Design System Tokens for Report Visualizations
export const designTokens = {
  // Color System - Accessible and reusable
  colors: {
    // Neutrals
    bg: '#F8FAFC',          // page background
    panel: '#FFFFFF',       // cards
    text: {
      900: '#0F172A',       // titles
      700: '#334155',       // body
      500: '#64748B',       // captions, axes
      400: '#94A3B8',       // muted
    },
    gridline: '#E2E8F0',    // chart grid

    // Accents - colorblind friendly categorical set
    chart: {
      blue: '#1D4ED8',      // primary (Clicks)
      orange: '#F59E0B',    // secondary (Impressions)
      green: '#10B981',     // tertiary
      purple: '#7C3AED',    // quaternary (CTR)
      magenta: '#EC4899',   // quinary
      teal: '#14B8A6',      // senary (Position)
    },

    // Status colors
    status: {
      good: '#16A34A',
      bad: '#DC2626',
      warn: '#D97706',
    }
  },

  // Typography
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    scale: {
      h2: '28px',
      h3: '20px',
      body: '16px',
      small: '14px',
      caption: '12px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  },

  // Spacing Tokens (4px base)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },

  // Layout
  layout: {
    maxWidth: '1320px',
    containerPadding: '24px',
    gutter: '24px',
    cardPadding: '20px',
    cardGap: '24px',
    sectionGap: '24px',
  },

  // Card anatomy
  card: {
    borderRadius: '12px',
    shadow: '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)',
    padding: '20px',
  },

  // Chart specifications
  chart: {
    height: {
      timeSeries: {
        desktop: 320,
        laptop: 260,
        tablet: 200,
      },
      category: 320,
      mini: 32,
      sparkline: 32,
    },
    padding: {
      left: 64,    // Fixed for y-axis labels
      right: 20,   // Fixed for alignment
      top: 20,
      bottom: 40,
    },
    lineWidth: 2,
    lineWidthHover: 3,
    dotRadius: 0,     // Only show on hover
    dotRadiusHover: 4,  // Last point on sparklines
    gridOpacity: 0.1,
    gridLines: {
      horizontal: 5,  // Maximum horizontal lines
      vertical: 6,    // Maximum x-axis ticks
    },
    axisLabelSize: 14,
    tickLabelSize: 12,
    captionSize: 12,
    barWidth: 0.64,  // 64% of band
    barRadius: 4,
  },

  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '960px',
    xl: '1200px',
  }
};

// Metric to color mapping for consistency
export const metricColorMap = {
  clicks: designTokens.colors.chart.blue,
  impressions: designTokens.colors.chart.orange,
  ctr: designTokens.colors.chart.purple,
  position: designTokens.colors.chart.teal,
  bounceRate: designTokens.colors.status.warn,
  avgDuration: designTokens.colors.chart.green,
  pagesPerSession: designTokens.colors.chart.magenta,
  // Traffic channels
  organic: designTokens.colors.chart.blue,
  direct: designTokens.colors.chart.green,
  referral: designTokens.colors.chart.orange,
  social: designTokens.colors.chart.purple,
  email: designTokens.colors.chart.magenta,
  paid: designTokens.colors.chart.teal,
};

// Number formatting utilities
export const formatters = {
  number: (value: number | undefined | null, forceUnit: boolean = false): string => {
    // Handle undefined/null values
    if (value === undefined || value === null || isNaN(value)) return '0';

    const abs = Math.abs(value);
    if (abs >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${(value / 1000).toFixed(1)}K`;
    if (abs >= 100) return Math.round(value).toLocaleString();
    if (abs < 10 && value !== Math.floor(value)) return value.toFixed(1);
    return value.toString();
  },

  percent: (value: number | undefined | null, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(value)) return '0%';
    return `${value.toFixed(decimals)}%`;
  },

  position: (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.0';
    return value.toFixed(1);
  },

  duration: (seconds: number | undefined | null): string => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return '0s';
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    }
    return `${Math.round(seconds)}s`;
  },

  delta: (value: number | undefined | null, showPlus: boolean = true): string => {
    if (value === undefined || value === null || isNaN(value)) return '0%';
    const formatted = formatters.percent(Math.abs(value));
    if (value > 0) return showPlus ? `+${formatted}` : formatted;
    if (value < 0) return `-${formatted}`;
    return formatted;
  },

  roundToNearest: (value: number | undefined | null, nearest: number): number => {
    if (value === undefined || value === null || isNaN(value)) return 0;
    return Math.round(value / nearest) * nearest;
  },

  date: {
    short: (date: Date): string => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    monthYear: (date: Date): string => {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    },
    weekday: (date: Date): string => {
      return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    }
  }
};

// Chart configuration defaults
export const chartDefaults = {
  margin: {
    top: designTokens.chart.padding.top,
    right: designTokens.chart.padding.right,
    bottom: designTokens.chart.padding.bottom,
    left: designTokens.chart.padding.left,
  },

  grid: {
    strokeDasharray: '3 3',
    stroke: designTokens.colors.gridline,
    strokeWidth: 1,
  },

  axis: {
    tick: {
      fontSize: designTokens.chart.tickLabelSize,
      fill: designTokens.colors.text[500],
    },
    label: {
      fontSize: designTokens.chart.axisLabelSize,
      fill: designTokens.colors.text[700],
    },
  },

  line: {
    type: 'monotone' as const,
    strokeWidth: designTokens.chart.lineWidth,
    dot: { r: designTokens.chart.dotRadius },
    activeDot: { r: designTokens.chart.dotRadiusHover },
    tension: 0.2, // Gentle curves
  },

  tooltip: {
    contentStyle: {
      background: designTokens.colors.panel,
      border: 'none',
      borderRadius: '8px',
      boxShadow: designTokens.card.shadow,
      padding: '12px',
    },
    labelStyle: {
      fontSize: '14px',
      fontWeight: 600,
      marginBottom: '4px',
    },
  },

  legend: {
    wrapperStyle: {
      paddingTop: '12px',
      fontSize: '14px',
    },
    iconType: 'line' as const,
    align: 'right' as const,
    verticalAlign: 'top' as const,
  },
};