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
      timeSeries: 240,
      category: 280,
      mini: 40,
      sparkline: 40,
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
    dotRadiusHover: 3,
    gridOpacity: 0.1,
    axisLabelSize: 12,
    tickLabelSize: 11,
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
  number: (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  },

  percent: (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
  },

  position: (value: number): string => {
    return value.toFixed(1);
  },

  duration: (seconds: number): string => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    }
    return `${seconds}s`;
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