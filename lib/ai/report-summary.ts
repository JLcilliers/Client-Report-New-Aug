// AI Report Summary Generator
// Supports OpenAI, Anthropic, or other AI providers

interface ReportMetrics {
  analytics: {
    sessions: number;
    users: number;
    pageviews: number;
    bounceRate: number;
    avgSessionDuration: number;
    previousMonth?: {
      sessions: number;
      users: number;
      pageviews: number;
    };
  };
  searchConsole: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    previousMonth?: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    };
  };
  topKeywords?: Array<{
    keyword: string;
    clicks: number;
    impressions: number;
    position: number;
  }>;
  achievements?: string[];
  challenges?: string[];
}

export class AIReportSummaryGenerator {
  private apiKey: string | undefined;
  private provider: 'openai' | 'anthropic' | 'mock';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.provider = process.env.OPENAI_API_KEY ? 'openai' :
                    process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock';
  }

  async generateExecutiveSummary(
    clientName: string,
    websiteUrl: string,
    metrics: ReportMetrics
  ): Promise<string> {
    if (this.provider === 'mock' || !this.apiKey) {
      return this.generateMockSummary(clientName, websiteUrl, metrics);
    }

    const prompt = this.buildPrompt(clientName, websiteUrl, metrics);

    try {
      if (this.provider === 'openai') {
        return await this.generateWithOpenAI(prompt);
      } else if (this.provider === 'anthropic') {
        return await this.generateWithAnthropic(prompt);
      }
    } catch (error) {
      
      return this.generateMockSummary(clientName, websiteUrl, metrics);
    }

    return this.generateMockSummary(clientName, websiteUrl, metrics);
  }

  private buildPrompt(clientName: string, websiteUrl: string, metrics: ReportMetrics): string {
    const sessionChange = this.calculateChange(
      metrics.analytics.sessions,
      metrics.analytics.previousMonth?.sessions
    );
    const clickChange = this.calculateChange(
      metrics.searchConsole.clicks,
      metrics.searchConsole.previousMonth?.clicks
    );

    return `Generate a professional executive summary for a monthly SEO report with the following data:

Client: ${clientName}
Website: ${websiteUrl}

Current Month Performance:
- Total Sessions: ${metrics.analytics.sessions} (${sessionChange}% change from last month)
- Organic Clicks: ${metrics.searchConsole.clicks} (${clickChange}% change from last month)
- Average Position: ${metrics.searchConsole.position.toFixed(1)}
- Click-Through Rate: ${(metrics.searchConsole.ctr * 100).toFixed(1)}%
- Bounce Rate: ${metrics.analytics.bounceRate}%

Top Performing Keywords:
${metrics.topKeywords?.slice(0, 5).map(k =>
  `- "${k.keyword}": ${k.clicks} clicks, position ${k.position.toFixed(1)}`
).join('\n') || 'No keyword data available'}

Key Achievements:
${metrics.achievements?.join('\n- ') || 'Improved overall search visibility'}

Challenges Addressed:
${metrics.challenges?.join('\n- ') || 'Ongoing optimization efforts'}

Write a 4-5 sentence executive summary that:
1. Highlights the most important metric changes
2. Notes 1-2 key achievements
3. Identifies the main area of focus for next month
4. Maintains a professional, optimistic but realistic tone
5. Avoids technical jargon

Keep it concise and focused on business impact.`;
  }

  private calculateChange(current?: number, previous?: number): number {
    if (!current || !previous || previous === 0) return 0;
    return ((current - previous) / previous * 100);
  }

  private async generateWithOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO consultant writing executive summaries for monthly client reports.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  private async generateWithAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text.trim();
  }

  private generateMockSummary(
    clientName: string,
    websiteUrl: string,
    metrics: ReportMetrics
  ): string {
    const sessionChange = this.calculateChange(
      metrics.analytics.sessions,
      metrics.analytics.previousMonth?.sessions
    );
    const clickChange = this.calculateChange(
      metrics.searchConsole.clicks,
      metrics.searchConsole.previousMonth?.clicks
    );

    const sessionTrend = sessionChange > 0 ? 'increased' : sessionChange < 0 ? 'decreased' : 'remained stable';
    const clickTrend = clickChange > 0 ? 'grew' : clickChange < 0 ? 'declined' : 'stayed consistent';

    const summaries = [
      `This month, ${clientName} experienced strong digital performance with website traffic ${sessionTrend} by ${Math.abs(sessionChange).toFixed(1)}% and organic search clicks ${clickTrend} by ${Math.abs(clickChange).toFixed(1)}%. The average search position improved to ${metrics.searchConsole.position.toFixed(1)}, demonstrating enhanced visibility for target keywords. Key achievements include ${metrics.achievements?.[0] || 'improved content optimization'} and ${metrics.achievements?.[1] || 'enhanced technical SEO'}. Moving forward, the focus will be on ${clickChange > 10 ? 'maintaining momentum' : 'accelerating growth'} while addressing ${metrics.challenges?.[0] || 'remaining optimization opportunities'}.`,

      `${clientName}'s digital presence showed ${sessionChange > 0 ? 'positive momentum' : 'areas for improvement'} this month, with total sessions ${sessionTrend} to ${metrics.analytics.sessions.toLocaleString()} and organic traffic ${clickTrend} to ${metrics.searchConsole.clicks.toLocaleString()} clicks. The site maintained an average position of ${metrics.searchConsole.position.toFixed(1)} in search results with a ${(metrics.searchConsole.ctr * 100).toFixed(1)}% click-through rate. Notable accomplishments include ${metrics.achievements?.[0] || 'strengthened keyword rankings'} and successful ${metrics.achievements?.[1] || 'content optimization initiatives'}. Next month's priorities will center on ${sessionChange > 0 ? 'scaling successful strategies' : 'implementing targeted improvements'} to drive continued growth.`,

      `During this reporting period, ${clientName} saw ${sessionChange > 0 ? 'encouraging growth' : 'steady performance'} across key metrics, with website sessions ${sessionTrend} by ${Math.abs(sessionChange).toFixed(1)}% and organic search visibility improving to position ${metrics.searchConsole.position.toFixed(1)}. The ${(metrics.searchConsole.ctr * 100).toFixed(1)}% click-through rate ${metrics.searchConsole.ctr > 0.03 ? 'exceeds' : 'approaches'} industry benchmarks, indicating strong search result appeal. Primary achievements this month include ${metrics.achievements?.[0] || 'enhanced user engagement'} and ${metrics.achievements?.[1] || 'improved search rankings'}. The strategy for next month will emphasize ${clickChange > 5 ? 'capitalizing on current momentum' : 'tactical optimizations'} to maximize organic growth potential.`
    ];

    // Select a random summary template for variety
    const selectedSummary = summaries[Math.floor(Math.random() * summaries.length)];
    return selectedSummary;
  }

  async generateMonthlyInsights(metrics: ReportMetrics): Promise<{
    achievements: string[];
    challenges: string[];
    recommendations: string[];
  }> {
    const achievements = [];
    const challenges = [];
    const recommendations = [];

    // Analyze metrics for achievements
    if (metrics.searchConsole.position < 15) {
      achievements.push('Achieved strong average search position below 15');
    }
    if (metrics.searchConsole.ctr > 0.05) {
      achievements.push('Maintained above-average click-through rate');
    }
    if (metrics.analytics.bounceRate < 50) {
      achievements.push('Excellent user engagement with low bounce rate');
    }

    // Identify challenges
    if (metrics.analytics.bounceRate > 70) {
      challenges.push('High bounce rate indicates content relevance issues');
      recommendations.push('Review and optimize landing page content for user intent');
    }
    if (metrics.searchConsole.position > 20) {
      challenges.push('Average position needs improvement for better visibility');
      recommendations.push('Focus on on-page optimization and content quality');
    }
    if (metrics.searchConsole.ctr < 0.02) {
      challenges.push('Low CTR suggests meta descriptions need optimization');
      recommendations.push('Rewrite meta titles and descriptions for better appeal');
    }

    // General recommendations
    recommendations.push('Continue building high-quality backlinks');
    recommendations.push('Expand content targeting long-tail keywords');
    recommendations.push('Monitor Core Web Vitals for technical improvements');

    return {
      achievements,
      challenges,
      recommendations: recommendations.slice(0, 4), // Limit to 4 recommendations
    };
  }
}

export const aiReportGenerator = new AIReportSummaryGenerator();