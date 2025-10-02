// AI Readiness Service - Uses Real Google API Data (No External APIs)
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';

const prisma = new PrismaClient();

interface AIReadinessMetrics {
  overallScore: number;
  sentimentScore: number;
  shareOfVoice: number;
  citationCount: number;
  accuracyScore: number;
  platformBreakdown: {
    platform: string;
    score: number;
    citations: number;
    sentiment: string;
  }[];
  topQueries: {
    query: string;
    frequency: number;
    platforms: string[];
    status: string;
  }[];
  competitors: {
    domain: string;
    shareOfVoice: number;
    gap: number;
  }[];
  recommendations: {
    title: string;
    description: string;
    priority: string;
    impact: string;
  }[];
}

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
}

export class AIReadinessService {
  // Get or create AI visibility profile
  async getOrCreateProfile(clientReportId: string) {
    let profile = await prisma.aIVisibilityProfile.findUnique({
      where: { clientReportId },
      include: {
        platformMetrics: true,
        citations: true,
        queries: true,
        recommendations: true,
        competitors: true,
      },
    });

    if (!profile) {
      profile = await prisma.aIVisibilityProfile.create({
        data: {
          clientReportId,
          overallScore: 0,
          sentimentScore: 0,
          shareOfVoice: 0,
          citationCount: 0,
          accuracyScore: 0,
        },
        include: {
          platformMetrics: true,
          citations: true,
          queries: true,
          recommendations: true,
          competitors: true,
        },
      });
    }

    return profile;
  }

  // Main function to calculate AI readiness using real data
  async calculateAIReadiness(
    clientReportId: string,
    searchConsolePropertyId: string,
    ga4PropertyId: string,
    domain: string,
    tokens?: GoogleTokens
  ) {
    const profile = await this.getOrCreateProfile(clientReportId);

    // Initialize scoring components
    let featuredSnippetScore = 0;
    let questionCoverageScore = 0;
    let schemaScore = 0;
    let contentQualityScore = 0;
    let eeeatScore = 0;

    try {
      // 1. Analyze Search Console Data
      if (tokens && searchConsolePropertyId) {
        const searchConsoleData = await this.analyzeSearchConsole(
          searchConsolePropertyId,
          tokens
        );

        featuredSnippetScore = searchConsoleData.featuredSnippetScore;
        questionCoverageScore = searchConsoleData.questionCoverageScore;

        // Store question queries
        await this.storeQuestionQueries(profile.id, searchConsoleData.topQuestions);
      }

      // 2. Analyze Schema & Technical SEO
      if (domain) {
        const schemaData = await this.analyzeSchema(domain);
        schemaScore = schemaData.score;

        // Store platform metrics based on schema readiness
        await this.storePlatformMetrics(profile.id, schemaData);
      }

      // 3. Analyze Content Quality from GA4
      if (tokens && ga4PropertyId) {
        const contentData = await this.analyzeContentQuality(ga4PropertyId, tokens);
        contentQualityScore = contentData.score;
      }

      // 4. Analyze E-E-A-T Signals
      if (domain) {
        const eeeatData = await this.analyzeEEEAT(domain);
        eeeatScore = eeeatData.score;
      }

      // 5. Calculate overall AI readiness score
      const overallScore = this.calculateOverallScore({
        featuredSnippet: featuredSnippetScore,
        questionCoverage: questionCoverageScore,
        schema: schemaScore,
        contentQuality: contentQualityScore,
        eeeat: eeeatScore,
      });

      // 6. Generate data-driven recommendations
      const recommendations = this.generateRecommendations({
        featuredSnippetScore,
        questionCoverageScore,
        schemaScore,
        contentQualityScore,
        eeeatScore,
        overallScore,
      });

      // 7. Update profile with real scores
      await prisma.aIVisibilityProfile.update({
        where: { id: profile.id },
        data: {
          overallScore,
          sentimentScore: contentQualityScore, // Based on engagement
          citationCount: Math.round(featuredSnippetScore * 2), // Featured snippets indicate citation-worthiness
          shareOfVoice: questionCoverageScore, // % of questions you rank for
          accuracyScore: schemaScore, // Structured data accuracy
          lastUpdated: new Date(),
        },
      });

      // 8. Store recommendations
      await this.storeRecommendations(profile.id, recommendations);

      return await this.getOrCreateProfile(clientReportId);
    } catch (error) {
      console.error('AI Readiness calculation error:', error);
      throw error;
    }
  }

  // Analyze Search Console for AI-relevant metrics
  private async analyzeSearchConsole(propertyId: string, tokens: GoogleTokens) {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

      // Get last 30 days of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await searchConsole.searchanalytics.query({
        siteUrl: propertyId,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query', 'page'],
          rowLimit: 1000,
        },
      });

      const rows = response.data.rows || [];

      // Analyze for AI-relevant patterns
      const questionQueries = rows.filter(row =>
        /^(who|what|when|where|why|how|is|are|can|do|does)/i.test(row.keys?.[0] || '')
      );

      const featuredSnippetQueries = rows.filter(row =>
        (row.position || 999) <= 1 && (row.ctr || 0) > 0.3
      );

      const topQuestions = questionQueries
        .slice(0, 10)
        .map(row => ({
          query: row.keys?.[0] || '',
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          position: row.position || 0,
          ctr: row.ctr || 0,
        }));

      return {
        featuredSnippetScore: Math.min((featuredSnippetQueries.length / rows.length) * 100, 100),
        questionCoverageScore: Math.min((questionQueries.length / rows.length) * 100, 100),
        topQuestions,
        totalQueries: rows.length,
      };
    } catch (error) {
      console.error('Search Console analysis error:', error);
      return {
        featuredSnippetScore: 0,
        questionCoverageScore: 0,
        topQuestions: [],
        totalQueries: 0,
      };
    }
  }

  // Analyze schema markup and structured data
  private async analyzeSchema(domain: string) {
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;

      // Use PageSpeed Insights API to check structured data
      const pagespeedKey = process.env.PAGESPEED_API_KEY;
      if (!pagespeedKey) {
        return { score: 50, hasSchema: false, schemaTypes: [] };
      }

      const response = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${pagespeedKey}`
      );

      if (!response.ok) {
        return { score: 50, hasSchema: false, schemaTypes: [] };
      }

      const data = await response.json();
      const lighthouseResult = data.lighthouseResult;

      // Check for structured data
      const structuredData = lighthouseResult?.audits?.['structured-data'];
      const hasValidSchema = structuredData?.score === 1;

      // Analyze meta tags for AI-friendliness
      const metaDescription = lighthouseResult?.audits?.['meta-description']?.score === 1;
      const documentTitle = lighthouseResult?.audits?.['document-title']?.score === 1;

      // Calculate schema score
      let score = 0;
      if (hasValidSchema) score += 40;
      if (metaDescription) score += 30;
      if (documentTitle) score += 30;

      return {
        score,
        hasSchema: hasValidSchema,
        schemaTypes: structuredData?.details?.items || [],
      };
    } catch (error) {
      console.error('Schema analysis error:', error);
      return { score: 50, hasSchema: false, schemaTypes: [] };
    }
  }

  // Analyze content quality from GA4
  private async analyzeContentQuality(propertyId: string, tokens: GoogleTokens) {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

      // Get engagement metrics
      const response = await analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'averageSessionDuration' },
            { name: 'engagementRate' },
            { name: 'screenPageViewsPerSession' },
          ],
          dimensions: [{ name: 'pagePath' }],
        },
      });

      const rows = response.data.rows || [];

      if (rows.length === 0) {
        return { score: 50 };
      }

      // Calculate average engagement metrics
      const avgEngagement = rows.reduce((sum, row) =>
        sum + parseFloat(row.metricValues?.[1]?.value || '0'), 0
      ) / rows.length;

      const avgDuration = rows.reduce((sum, row) =>
        sum + parseFloat(row.metricValues?.[0]?.value || '0'), 0
      ) / rows.length;

      // Score based on engagement (higher = better content quality)
      const score = Math.min(
        (avgEngagement * 100) + (avgDuration / 60) * 10,
        100
      );

      return { score: Math.max(score, 0) };
    } catch (error) {
      console.error('Content quality analysis error:', error);
      return { score: 50 };
    }
  }

  // Analyze E-E-A-T signals
  private async analyzeEEEAT(domain: string) {
    // This would ideally scrape and analyze the site's content
    // For now, we'll use PageSpeed API to check basic signals
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const pagespeedKey = process.env.PAGESPEED_API_KEY;

      if (!pagespeedKey) {
        return { score: 50 };
      }

      const response = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${pagespeedKey}`
      );

      if (!response.ok) {
        return { score: 50 };
      }

      const data = await response.json();
      const audits = data.lighthouseResult?.audits || {};

      // Check E-E-A-T indicators
      let score = 0;

      // Expertise signals
      if (audits['meta-description']?.score === 1) score += 20;
      if (audits['document-title']?.score === 1) score += 20;

      // Authority signals (HTTPS, valid cert)
      if (audits['is-on-https']?.score === 1) score += 30;

      // Trust signals (no security issues)
      if (audits['errors-in-console']?.score === 1) score += 15;
      if (audits['no-vulnerable-libraries']?.score === 1) score += 15;

      return { score: Math.min(score, 100) };
    } catch (error) {
      console.error('E-E-A-T analysis error:', error);
      return { score: 50 };
    }
  }

  // Calculate overall AI readiness score
  private calculateOverallScore(scores: {
    featuredSnippet: number;
    questionCoverage: number;
    schema: number;
    contentQuality: number;
    eeeat: number;
  }) {
    // Weighted average based on importance for AI visibility
    const weights = {
      featuredSnippet: 0.25, // 25% - Most important for AI citations
      questionCoverage: 0.20, // 20% - AI loves answering questions
      schema: 0.25, // 25% - Critical for AI understanding
      contentQuality: 0.15, // 15% - Engagement signals
      eeeat: 0.15, // 15% - Trust and authority
    };

    return (
      scores.featuredSnippet * weights.featuredSnippet +
      scores.questionCoverage * weights.questionCoverage +
      scores.schema * weights.schema +
      scores.contentQuality * weights.contentQuality +
      scores.eeeat * weights.eeeat
    );
  }

  // Generate recommendations based on scores
  private generateRecommendations(scores: {
    featuredSnippetScore: number;
    questionCoverageScore: number;
    schemaScore: number;
    contentQualityScore: number;
    eeeatScore: number;
    overallScore: number;
  }) {
    const recommendations = [];

    // Schema recommendations
    if (scores.schemaScore < 70) {
      recommendations.push({
        type: 'schema',
        priority: 'high',
        title: 'Add Structured Data Markup',
        description: 'Implement FAQ, Article, and Organization schema to help AI systems understand your content. Your current schema score is low.',
        impact: 'High - Can improve AI visibility by 40%',
        effort: 'medium',
        estimatedImpact: 40,
      });
    }

    // Question coverage recommendations
    if (scores.questionCoverageScore < 60) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        title: 'Create Question-Focused Content',
        description: 'Only ' + scores.questionCoverageScore.toFixed(0) + '% of your ranking queries are questions. Create comprehensive Q&A content to capture AI citations.',
        impact: 'Very High - AI platforms prioritize question-answering content',
        effort: 'medium',
        estimatedImpact: 35,
      });
    }

    // Featured snippet recommendations
    if (scores.featuredSnippetScore < 50) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: 'Optimize for Featured Snippets',
        description: 'Your featured snippet capture rate is low. Structure content with clear definitions, lists, and tables.',
        impact: 'High - Featured snippets feed AI Overviews',
        effort: 'low',
        estimatedImpact: 30,
      });
    }

    // Content quality recommendations
    if (scores.contentQualityScore < 60) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        title: 'Improve Content Engagement',
        description: 'Your engagement metrics are below optimal. Create more in-depth, valuable content that keeps users engaged.',
        impact: 'Medium - Higher engagement signals content quality to AI',
        effort: 'high',
        estimatedImpact: 20,
      });
    }

    // E-E-A-T recommendations
    if (scores.eeeatScore < 70) {
      recommendations.push({
        type: 'authority',
        priority: 'medium',
        title: 'Strengthen E-E-A-T Signals',
        description: 'Add author bios, credentials, sources, and update date information to demonstrate expertise and trustworthiness.',
        impact: 'Medium - Builds trust with AI systems',
        effort: 'medium',
        estimatedImpact: 25,
      });
    }

    return recommendations;
  }

  // Store question queries for display
  private async storeQuestionQueries(profileId: string, questions: any[]) {
    for (const question of questions.slice(0, 10)) {
      const status = question.position <= 3 ? 'captured' :
                    question.position <= 10 ? 'partial' : 'missed';

      await prisma.aIQueryInsight.upsert({
        where: {
          profileId_query: {
            profileId,
            query: question.query,
          },
        },
        update: {
          triggerFrequency: question.impressions,
          averagePosition: question.position,
          platforms: ['Google Search', 'AI Overviews'],
          status,
        },
        create: {
          profileId,
          query: question.query,
          triggerFrequency: question.impressions,
          averagePosition: question.position,
          platforms: ['Google Search', 'AI Overviews'],
          searchVolume: question.impressions,
          difficulty: question.position * 10,
          opportunity: status === 'captured' ? 'high' : 'medium',
          status,
        },
      });
    }
  }

  // Store platform metrics
  private async storePlatformMetrics(profileId: string, schemaData: any) {
    const platforms = [
      { name: 'Schema Readiness', score: schemaData.score },
      { name: 'Featured Snippets', score: 0 }, // Will be updated with real data
      { name: 'Question Coverage', score: 0 }, // Will be updated with real data
      { name: 'Content Quality', score: 0 }, // Will be updated with real data
      { name: 'E-E-A-T Signals', score: 0 }, // Will be updated with real data
    ];

    for (const platform of platforms) {
      await prisma.aIPlatformMetric.upsert({
        where: {
          profileId_platform: {
            profileId,
            platform: platform.name,
          },
        },
        update: {
          visibilityScore: platform.score,
          citationCount: 0,
          sentimentScore: 75,
          lastChecked: new Date(),
        },
        create: {
          profileId,
          platform: platform.name,
          visibilityScore: platform.score,
          citationCount: 0,
          sentimentScore: 75,
        },
      });
    }
  }

  // Store recommendations
  private async storeRecommendations(profileId: string, recommendations: any[]) {
    // Clear old recommendations
    await prisma.aIRecommendation.deleteMany({
      where: { profileId, status: 'pending' },
    });

    // Add new recommendations
    for (const rec of recommendations) {
      await prisma.aIRecommendation.create({
        data: {
          profileId,
          ...rec,
          implementationGuide: `Steps to implement: ${rec.title}`,
        },
      });
    }
  }

  // Get formatted metrics for frontend
  async getFormattedMetrics(clientReportId: string): Promise<AIReadinessMetrics> {
    const profile = await this.getOrCreateProfile(clientReportId);

    return {
      overallScore: profile.overallScore,
      sentimentScore: profile.sentimentScore,
      shareOfVoice: profile.shareOfVoice,
      citationCount: profile.citationCount,
      accuracyScore: profile.accuracyScore,
      platformBreakdown: profile.platformMetrics.slice(0, 5).map(pm => ({
        platform: pm.platform,
        score: pm.visibilityScore,
        citations: pm.citationCount,
        sentiment: pm.sentimentScore >= 70 ? 'positive' : pm.sentimentScore <= 30 ? 'negative' : 'neutral',
      })),
      topQueries: profile.queries.slice(0, 10).map(q => ({
        query: q.query,
        frequency: q.triggerFrequency,
        platforms: q.platforms,
        status: q.status,
      })),
      competitors: profile.competitors.slice(0, 5).map(c => ({
        domain: c.competitorDomain,
        shareOfVoice: c.shareOfVoice,
        gap: c.gap,
      })),
      recommendations: profile.recommendations.slice(0, 5).map(r => ({
        title: r.title,
        description: r.description,
        priority: r.priority,
        impact: r.impact,
      })),
    };
  }
}

export const aiReadinessService = new AIReadinessService();
