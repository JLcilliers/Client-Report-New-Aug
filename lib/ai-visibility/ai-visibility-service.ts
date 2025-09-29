// AI Visibility Service - Core business logic for AI visibility tracking
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

    // For now, generate mock data directly until DataForSEO is properly configured
    const useMockData = true; // TODO: Check if API key exists

    // Prepare test queries
    const testQueries = keywords.length > 0 ? keywords : [
      `best ${domain} services`,
      `${domain} reviews`,
      `is ${domain} good`,
      domain,
    ];

    if (useMockData) {
      // Generate mock data for demonstration
      const platforms = ['ChatGPT', 'Claude', 'Google Gemini', 'Perplexity AI', 'Google AI Overviews'];
      let totalCitations = 0;
      let totalSentimentScore = 0;

      for (const platform of platforms) {
        const citations = Math.floor(Math.random() * 5) + 2; // 2-6 citations per platform
        const sentiment = Math.random() * 100;
        const visibility = 50 + Math.random() * 50; // 50-100 score

        totalCitations += citations;
        totalSentimentScore += sentiment;

        // Update or create platform metrics
        await prisma.aIPlatformMetric.upsert({
          where: {
            profileId_platform: {
              profileId: profile.id,
              platform,
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
            platform,
            visibilityScore: visibility,
            citationCount: citations,
            sentimentScore: sentiment,
          },
        });

        // Create sample citations
        for (let i = 0; i < Math.min(citations, 2); i++) {
          await prisma.aICitation.create({
            data: {
              profileId: profile.id,
              platform,
              query: testQueries[i % testQueries.length],
              responseText: `Mock AI response mentioning ${domain} as a leading provider in the industry...`,
              citationPosition: i + 1,
              citationContext: `${domain} provides excellent services`,
              url: `https://${domain}`,
              sentiment: sentiment > 60 ? 'positive' : sentiment > 40 ? 'neutral' : 'negative',
              accuracy: 'accurate',
            },
          });
        }
      }

      // Update profile with mock scores
      await prisma.aIVisibilityProfile.update({
        where: { id: profile.id },
        data: {
          overallScore: 65 + Math.random() * 20, // 65-85 score
          sentimentScore: totalSentimentScore / platforms.length,
          citationCount: totalCitations,
          shareOfVoice: 15 + Math.random() * 25, // 15-40%
          accuracyScore: 85 + Math.random() * 10, // 85-95%
          lastUpdated: new Date(),
        },
      });

      // Generate recommendations
      await this.generateRecommendations(profile.id, 70, totalCitations);

      return this.getOrCreateProfile(clientReportId);
    }

    // Original API-based code follows...
    const platforms = ['gpt-4', 'claude-3', 'gemini-pro', 'perplexity'];
    let totalCitations = 0;
    let totalSentimentScore = 0;
    let platformCount = 0;

    // Process each platform
    for (const platform of platforms) {
      try {
        const responses = await dataForSEOClient.getLLMResponses(
          testQueries.join(', '),
          [platform]
        );

        if (responses.length > 0) {
          const response = responses[0];
          const citations = response.citations || [];
          const domainCitations = citations.filter((c: string) =>
            c.toLowerCase().includes(domain.toLowerCase())
          );

          totalCitations += domainCitations.length;
          platformCount++;

          // Calculate sentiment score
          const sentimentValue = response.sentiment === 'positive' ? 100 :
            response.sentiment === 'negative' ? 0 : 50;
          totalSentimentScore += sentimentValue;

          // Update or create platform metric
          await prisma.aIPlatformMetric.upsert({
            where: {
              profileId_platform: {
                profileId: profile.id,
                platform,
              },
            },
            update: {
              visibilityScore: dataForSEOClient.calculateVisibilityScore(
                citations,
                domain,
                -1,
                10
              ),
              citationCount: domainCitations.length,
              sentimentScore: sentimentValue,
              responseData: response as any,
              lastChecked: new Date(),
            },
            create: {
              profileId: profile.id,
              platform,
              visibilityScore: dataForSEOClient.calculateVisibilityScore(
                citations,
                domain,
                -1,
                10
              ),
              citationCount: domainCitations.length,
              sentimentScore: sentimentValue,
              responseData: response as any,
            },
          });

          // Store citations
          for (const citation of domainCitations) {
            await prisma.aICitation.create({
              data: {
                profileId: profile.id,
                platform,
                query: testQueries[0],
                responseText: response.response,
                citationPosition: citations.indexOf(citation) + 1,
                citationContext: citation,
                sentiment: response.sentiment || 'neutral',
                accuracy: 'accurate', // Would need manual verification
              },
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching data for platform ${platform}:`, error);
      }
    }

    // Get Google AI Overviews data
    const googleOverviews = await dataForSEOClient.getGoogleAIOverviews(testQueries);
    for (const overview of googleOverviews) {
      if (overview.hasAIOverview && overview.citations) {
        const domainInOverview = overview.citations.some((c: string) =>
          c.toLowerCase().includes(domain.toLowerCase())
        );

        if (domainInOverview) {
          totalCitations++;
          await prisma.aIPlatformMetric.upsert({
            where: {
              profileId_platform: {
                profileId: profile.id,
                platform: 'google_ai',
              },
            },
            update: {
              citationCount: totalCitations,
              visibilityScore: 80, // High score for Google AI Overview
              lastChecked: new Date(),
            },
            create: {
              profileId: profile.id,
              platform: 'google_ai',
              citationCount: 1,
              visibilityScore: 80,
            },
          });
        }
      }
    }

    // Update competitor analysis if provided
    if (competitors.length > 0) {
      const competitorData = await dataForSEOClient.getCompetitorVisibility(
        domain,
        competitors,
        testQueries
      );

      for (const competitor of competitors) {
        if (competitorData[competitor]) {
          await prisma.aICompetitorAnalysis.upsert({
            where: {
              profileId_competitorDomain: {
                profileId: profile.id,
                competitorDomain: competitor,
              },
            },
            update: {
              shareOfVoice: competitorData[competitor].shareOfVoice,
              citationCount: competitorData[competitor].totalCitations,
              sentimentScore: 50, // Placeholder
              platforms: competitorData[competitor].platforms,
              gap: competitorData[domain].shareOfVoice - competitorData[competitor].shareOfVoice,
              lastAnalyzed: new Date(),
            },
            create: {
              profileId: profile.id,
              competitorDomain: competitor,
              competitorName: competitor,
              shareOfVoice: competitorData[competitor].shareOfVoice,
              citationCount: competitorData[competitor].totalCitations,
              sentimentScore: 50,
              platforms: competitorData[competitor].platforms,
              strengthAreas: [],
              weaknessAreas: [],
              gap: competitorData[domain].shareOfVoice - competitorData[competitor].shareOfVoice,
            },
          });
        }
      }
    }

    // Calculate overall scores
    const overallScore = platformCount > 0 ? (totalCitations / (platformCount * testQueries.length)) * 100 : 0;
    const sentimentScore = platformCount > 0 ? totalSentimentScore / platformCount : 0;

    // Update profile with new scores
    await prisma.aIVisibilityProfile.update({
      where: { id: profile.id },
      data: {
        overallScore: Math.min(overallScore, 100),
        sentimentScore,
        citationCount: totalCitations,
        shareOfVoice: competitors.length > 0 ?
          (totalCitations / ((competitors.length + 1) * platformCount * testQueries.length)) * 100 :
          overallScore,
        lastUpdated: new Date(),
      },
    });

    // Generate recommendations
    await this.generateRecommendations(profile.id, overallScore, totalCitations);

    // Store trend data
    await prisma.aIVisibilityTrend.create({
      data: {
        profileId: profile.id,
        date: new Date(),
        overallScore: Math.min(overallScore, 100),
        citationCount: totalCitations,
        sentimentScore,
        shareOfVoice: competitors.length > 0 ?
          (totalCitations / ((competitors.length + 1) * platformCount * testQueries.length)) * 100 :
          overallScore,
        platformBreakdown: { platforms },
        topQueries: { queries: testQueries },
      },
    });

    return this.getOrCreateProfile(clientReportId);
  }

  // Generate AI visibility recommendations
  private async generateRecommendations(
    profileId: string,
    overallScore: number,
    citationCount: number
  ) {
    const recommendations = [];

    if (overallScore < 30) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        title: 'Improve Content Structure for AI',
        description: 'Your content needs better structuring for AI systems. Add clear headings, FAQ sections, and bullet points to improve AI readability.',
        impact: 'High impact on visibility',
        effort: 'medium',
      });
    }

    if (citationCount < 5) {
      recommendations.push({
        type: 'entity',
        priority: 'high',
        title: 'Strengthen Entity Recognition',
        description: 'Build stronger entity associations by ensuring consistent NAP (Name, Address, Phone) across all platforms and adding structured data.',
        impact: 'Medium to high impact',
        effort: 'low',
      });

      recommendations.push({
        type: 'content',
        priority: 'medium',
        title: 'Increase Reddit and Forum Presence',
        description: 'Engage authentically on Reddit and industry forums. Studies show this can boost AI citations by 35%.',
        impact: 'Medium impact',
        effort: 'medium',
      });
    }

    recommendations.push({
      type: 'schema',
      priority: 'medium',
      title: 'Implement FAQ Schema',
      description: 'Add FAQ schema markup to your key pages. This helps AI systems understand and cite your content more effectively.',
      impact: 'Medium impact',
      effort: 'low',
    });

    // Save recommendations
    for (const rec of recommendations) {
      await prisma.aIRecommendation.create({
        data: {
          profileId,
          ...rec,
          implementationGuide: `Step-by-step guide for: ${rec.title}`,
          estimatedImpact: rec.priority === 'high' ? 30 : 15,
        },
      });
    }
  }

  // Get formatted metrics for frontend display
  async getFormattedMetrics(clientReportId: string): Promise<AIVisibilityMetrics> {
    const profile = await this.getOrCreateProfile(clientReportId);

    return {
      overallScore: profile.overallScore,
      sentimentScore: profile.sentimentScore,
      shareOfVoice: profile.shareOfVoice,
      citationCount: profile.citationCount,
      accuracyScore: profile.accuracyScore,
      platformBreakdown: profile.platformMetrics.map(pm => ({
        platform: this.formatPlatformName(pm.platform),
        score: pm.visibilityScore,
        citations: pm.citationCount,
        sentiment: this.getSentimentLabel(pm.sentimentScore),
      })),
      topQueries: profile.queries.map(q => ({
        query: q.query,
        frequency: q.triggerFrequency,
        platforms: q.platforms,
        status: q.status,
      })),
      competitors: profile.competitors.map(c => ({
        domain: c.competitorDomain,
        shareOfVoice: c.shareOfVoice,
        gap: c.gap,
      })),
      recommendations: profile.recommendations.map(r => ({
        title: r.title,
        description: r.description,
        priority: r.priority,
        impact: r.impact,
      })),
    };
  }

  // Format platform names for display
  private formatPlatformName(platform: string): string {
    const names: { [key: string]: string } = {
      'gpt-4': 'ChatGPT',
      'claude-3': 'Claude',
      'gemini-pro': 'Google Gemini',
      'perplexity': 'Perplexity AI',
      'google_ai': 'Google AI Overviews',
    };
    return names[platform] || platform;
  }

  // Get sentiment label from score
  private getSentimentLabel(score: number): string {
    if (score >= 70) return 'positive';
    if (score <= 30) return 'negative';
    return 'neutral';
  }
}

export const aiVisibilityService = new AIVisibilityService();