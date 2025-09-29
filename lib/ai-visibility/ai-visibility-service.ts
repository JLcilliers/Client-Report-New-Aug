// AI Visibility Service - Fixed version with no duplicates
import { PrismaClient } from '@prisma/client';
import { dataForSEOClient } from './dataforseo-client';

const prisma = new PrismaClient();

interface AIVisibilityMetrics {
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

export class AIVisibilityService {
  // Initialize or get AI visibility profile for a report
  async getOrCreateProfile(clientReportId: string) {
    let profile = await prisma.aIVisibilityProfile.findUnique({
      where: { clientReportId },
      include: {
        platformMetrics: true,
        citations: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
        queries: {
          take: 10,
          orderBy: { triggerFrequency: 'desc' },
        },
        recommendations: {
          where: { status: 'pending' },
          orderBy: { priority: 'asc' },
          take: 5, // Limit to 5 recommendations
        },
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

  // Fetch and update AI visibility data
  async updateVisibilityData(
    clientReportId: string,
    domain: string,
    keywords: string[] = [],
    competitors: string[] = []
  ) {
    const profile = await this.getOrCreateProfile(clientReportId);

    // Clear old data to prevent duplicates
    await this.clearOldData(profile.id);

    // For now, generate mock data directly until DataForSEO is properly configured
    const useMockData = true;

    // Prepare test queries - ensure variety
    const baseQueries = [
      `${domain} services`,
      `${domain} reviews`,
      `${domain} pricing`,
      `${domain} alternatives`,
      `how to use ${domain}`,
      `${domain} customer support`,
    ];

    const testQueries = keywords.length > 0
      ? [...keywords.slice(0, 6), ...baseQueries.slice(0, 3)]
      : baseQueries;

    if (useMockData) {
      // Generate mock data for demonstration - NO DUPLICATES
      const platforms = [
        { name: 'ChatGPT', color: '#10A37F' },
        { name: 'Claude', color: '#7C3AED' },
        { name: 'Google Gemini', color: '#4285F4' },
        { name: 'Perplexity AI', color: '#00D4FF' },
        { name: 'Google AI Overviews', color: '#EA4335' }
      ];

      let totalCitations = 0;
      let totalSentimentScore = 0;

      // Process each platform ONCE with more balanced data
      for (let idx = 0; idx < platforms.length; idx++) {
        const platformData = platforms[idx];
        // Ensure more balanced citation distribution
        const baseCitations = [5, 4, 6, 3, 4]; // Predefined for consistency
        const citations = baseCitations[idx] || Math.floor(Math.random() * 4) + 3;
        const sentiment = 65 + Math.random() * 30; // 65-95 sentiment
        const visibility = 60 + Math.random() * 35; // 60-95 score

        totalCitations += citations;
        totalSentimentScore += sentiment;

        // Update or create platform metrics - using upsert to prevent duplicates
        await prisma.aIPlatformMetric.upsert({
          where: {
            profileId_platform: {
              profileId: profile.id,
              platform: platformData.name,
            },
          },
          update: {
            visibilityScore: visibility,
            citationCount: citations,
            sentimentScore: sentiment,
            lastChecked: new Date(),
          },
          create: {
            profileId: profile.id,
            platform: platformData.name,
            visibilityScore: visibility,
            citationCount: citations,
            sentimentScore: sentiment,
          },
        });

        // Create varied citations for each platform with actual queries
        const actualSearchQueries = [
          `best ${domain} features`,
          `${domain} customer reviews`,
          `how does ${domain} work`,
          `${domain} pricing comparison`,
          `${domain} vs alternatives`,
          `is ${domain} reliable`
        ];

        for (let i = 0; i < citations; i++) {
          const queryToUse = actualSearchQueries[i % actualSearchQueries.length];
          await prisma.aICitation.create({
            data: {
              profileId: profile.id,
              platform: platformData.name,
              query: queryToUse,
              responseText: this.generateMockResponse(domain, platformData.name, i),
              citationPosition: i + 1,
              citationContext: this.generateCitationContext(domain, i),
              url: `https://${domain}`,
              sentiment: sentiment > 70 ? 'positive' : sentiment > 50 ? 'neutral' : 'negative',
              accuracy: 'accurate',
            },
          });
        }
      }

      // Create diverse query insights with actual search queries
      const actualQueries = [
        `what is ${domain}`,
        `${domain} reviews`,
        `${domain} vs competitors`,
        `how to use ${domain}`,
        `${domain} pricing plans`,
        `is ${domain} worth it`,
        `${domain} alternatives`,
        `${domain} customer support`
      ];

      const queryStatuses = ['captured', 'missed', 'partial'];
      const queryOpportunities = ['high', 'medium', 'low'];

      // Use actual queries instead of test queries
      const queriesToUse = keywords.length > 0
        ? [...keywords.slice(0, 4), ...actualQueries.slice(0, 4)]
        : actualQueries;

      for (let i = 0; i < Math.min(queriesToUse.length, 8); i++) {
        const query = queriesToUse[i];
        const randomPlatforms = platforms
          .filter(() => Math.random() > 0.4)
          .map(p => p.name);

        await prisma.aIQueryInsight.upsert({
          where: {
            profileId_query: {
              profileId: profile.id,
              query: query,
            },
          },
          update: {
            triggerFrequency: Math.floor(Math.random() * 50) + 10,
            averagePosition: Math.random() * 5 + 1,
            platforms: randomPlatforms,
            searchVolume: Math.floor(Math.random() * 5000) + 500,
            difficulty: Math.random() * 100,
            opportunity: queryOpportunities[i % 3],
            status: queryStatuses[i % 3],
          },
          create: {
            profileId: profile.id,
            query: query,
            triggerFrequency: Math.floor(Math.random() * 50) + 10,
            averagePosition: Math.random() * 5 + 1,
            platforms: randomPlatforms,
            searchVolume: Math.floor(Math.random() * 5000) + 500,
            difficulty: Math.random() * 100,
            opportunity: queryOpportunities[i % 3],
            status: queryStatuses[i % 3],
          },
        });
      }

      // Update profile with mock scores
      await prisma.aIVisibilityProfile.update({
        where: { id: profile.id },
        data: {
          overallScore: 68 + Math.random() * 25, // 68-93 score
          sentimentScore: totalSentimentScore / platforms.length,
          citationCount: totalCitations,
          shareOfVoice: 18 + Math.random() * 30, // 18-48%
          accuracyScore: 88 + Math.random() * 10, // 88-98%
          lastUpdated: new Date(),
        },
      });

      // Generate diverse recommendations (no duplicates)
      await this.generateUniqueRecommendations(profile.id, 75, totalCitations);

      return this.getOrCreateProfile(clientReportId);
    }

    // Original API code would go here...
    return profile;
  }

  // Clear old data to prevent duplicates
  private async clearOldData(profileId: string) {
    // Delete old citations to prevent accumulation
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.aICitation.deleteMany({
      where: {
        profileId,
        timestamp: { lt: oneDayAgo }
      }
    });

    // Clear old recommendations
    await prisma.aIRecommendation.deleteMany({
      where: {
        profileId,
        status: 'pending',
        createdAt: { lt: oneDayAgo }
      }
    });
  }

  // Generate varied mock responses
  private generateMockResponse(domain: string, platform: string, index: number): string {
    const responses = [
      `${platform} recommends ${domain} as a top-tier solution for businesses looking to improve their online presence.`,
      `According to our analysis, ${domain} stands out for its comprehensive features and excellent customer support.`,
      `${domain} has been recognized as an industry leader with innovative approaches to SEO reporting.`,
      `Users frequently mention ${domain} when discussing reliable SEO tools and reporting platforms.`,
      `The ${domain} platform offers unique advantages compared to traditional reporting solutions.`,
      `Expert reviews consistently highlight ${domain}'s user-friendly interface and powerful analytics.`,
    ];
    return responses[index % responses.length];
  }

  // Generate varied citation contexts
  private generateCitationContext(domain: string, index: number): string {
    const contexts = [
      `${domain} provides industry-leading SEO reporting solutions`,
      `Comprehensive analytics and insights from ${domain}`,
      `${domain}'s innovative approach to client reporting`,
      `Trusted by agencies worldwide, ${domain} delivers results`,
      `${domain} simplifies complex SEO data into actionable insights`,
      `Professional reporting made easy with ${domain}`,
    ];
    return contexts[index % contexts.length];
  }

  // Generate unique recommendations without duplicates
  private async generateUniqueRecommendations(
    profileId: string,
    overallScore: number,
    citationCount: number
  ) {
    // Clear existing pending recommendations first
    await prisma.aIRecommendation.deleteMany({
      where: {
        profileId,
        status: 'pending'
      }
    });

    const uniqueRecommendations = [
      {
        type: 'schema',
        priority: 'high',
        title: 'Implement Structured Data Markup',
        description: 'Add FAQ, Article, and Organization schema to help AI systems better understand your content structure and improve citation accuracy.',
        impact: 'High impact - 40% increase in AI visibility',
        effort: 'low',
      },
      {
        type: 'content',
        priority: 'high',
        title: 'Create AI-Optimized Content Hubs',
        description: 'Develop comprehensive topic clusters with detailed Q&A sections that AI systems prefer to cite as authoritative sources.',
        impact: 'Very high impact on visibility',
        effort: 'medium',
      },
      {
        type: 'entity',
        priority: 'medium',
        title: 'Build Knowledge Graph Presence',
        description: 'Establish consistent entity information across Wikipedia, Wikidata, and industry directories to strengthen AI recognition.',
        impact: 'Medium to high impact',
        effort: 'medium',
      },
      {
        type: 'technical',
        priority: 'medium',
        title: 'Optimize for Featured Snippets',
        description: 'Structure content with clear definitions, lists, and tables that AI systems can easily extract and cite.',
        impact: 'Medium impact - quick wins',
        effort: 'low',
      },
      {
        type: 'content',
        priority: 'low',
        title: 'Increase Reddit and Forum Presence',
        description: 'Participate authentically in relevant discussions where AI systems frequently source information.',
        impact: 'Gradual but sustained impact',
        effort: 'high',
      },
    ];

    // Select recommendations based on score
    let recsToAdd = [];
    if (overallScore < 70) {
      recsToAdd = uniqueRecommendations.slice(0, 3);
    } else if (overallScore < 85) {
      recsToAdd = [uniqueRecommendations[2], uniqueRecommendations[3], uniqueRecommendations[4]];
    } else {
      recsToAdd = [uniqueRecommendations[3], uniqueRecommendations[4]];
    }

    // Add selected recommendations
    for (const rec of recsToAdd) {
      await prisma.aIRecommendation.create({
        data: {
          profileId,
          ...rec,
          implementationGuide: `Detailed steps for: ${rec.title}`,
          estimatedImpact: rec.priority === 'high' ? 35 : rec.priority === 'medium' ? 20 : 10,
        },
      });
    }
  }

  // Get formatted metrics for frontend display
  async getFormattedMetrics(clientReportId: string): Promise<AIVisibilityMetrics> {
    const profile = await this.getOrCreateProfile(clientReportId);

    // Remove duplicates from platform metrics - use Map to ensure uniqueness
    const uniquePlatforms = new Map<string, typeof profile.platformMetrics[0]>();
    profile.platformMetrics.forEach(pm => {
      // Only keep the first occurrence of each platform
      if (!uniquePlatforms.has(pm.platform)) {
        uniquePlatforms.set(pm.platform, pm);
      }
    });

    // Ensure queries are populated and unique
    const uniqueQueries = new Map<string, typeof profile.queries[0]>();
    profile.queries.forEach(q => {
      if (!uniqueQueries.has(q.query)) {
        uniqueQueries.set(q.query, q);
      }
    });

    // Ensure recommendations are unique by title
    const uniqueRecommendations = new Map<string, typeof profile.recommendations[0]>();
    profile.recommendations.forEach(r => {
      if (!uniqueRecommendations.has(r.title)) {
        uniqueRecommendations.set(r.title, r);
      }
    });

    return {
      overallScore: profile.overallScore,
      sentimentScore: profile.sentimentScore,
      shareOfVoice: profile.shareOfVoice,
      citationCount: profile.citationCount,
      accuracyScore: profile.accuracyScore,
      platformBreakdown: Array.from(uniquePlatforms.values())
        .slice(0, 5) // Limit to 5 platforms max
        .map(pm => ({
          platform: pm.platform, // Use platform name as-is, already formatted
          score: pm.visibilityScore,
          citations: pm.citationCount,
          sentiment: this.getSentimentLabel(pm.sentimentScore),
        })),
      topQueries: Array.from(uniqueQueries.values())
        .slice(0, 8)
        .map(q => ({
          query: q.query,
          frequency: q.triggerFrequency,
          platforms: q.platforms,
          status: q.status,
        })),
      competitors: profile.competitors
        .slice(0, 5)
        .map(c => ({
          domain: c.competitorDomain,
          shareOfVoice: c.shareOfVoice,
          gap: c.gap,
        })),
      recommendations: Array.from(uniqueRecommendations.values())
        .slice(0, 5)
        .map(r => ({
          title: r.title,
          description: r.description,
          priority: r.priority,
          impact: r.impact,
        })),
    };
  }

  // Format platform names for display
  private formatPlatformName(platform: string): string {
    // Return as-is, already properly formatted
    return platform;
  }

  // Get sentiment label from score
  private getSentimentLabel(score: number): string {
    if (score >= 70) return 'positive';
    if (score <= 30) return 'negative';
    return 'neutral';
  }
}

export const aiVisibilityService = new AIVisibilityService();