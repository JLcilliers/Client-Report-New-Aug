// DataForSEO API Client for AI Visibility Tracking
import { headers } from 'next/headers';

// DataForSEO API credentials - Already Base64 encoded
const API_KEY = process.env.DATAFORSEO_API_KEY || '';
const BASE_URL = 'https://api.dataforseo.com/v3';

interface DataForSEOResponse {
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: any[];
}

interface AIKeywordData {
  keyword: string;
  location_code?: number;
  language_code?: string;
  ai_search_volume?: number;
  trend?: number[];
  platforms?: string[];
}

interface LLMResponse {
  prompt: string;
  model: string;
  response: string;
  citations?: string[];
  confidence?: number;
  sentiment?: string;
}

export class DataForSEOClient {
  private headers: HeadersInit;
  private useMockData: boolean;

  constructor() {
    this.useMockData = !API_KEY || API_KEY === '';

    if (!this.useMockData) {
      // API_KEY is already Base64 encoded from environment variable
      this.headers = {
        'Authorization': `Basic ${API_KEY}`,
        'Content-Type': 'application/json',
      };
    } else {
      this.headers = {
        'Content-Type': 'application/json',
      };
    }
  }

  // Get AI keyword data with search volumes and trends
  async getAIKeywordData(keywords: string[], location = 2840, language = 'en'): Promise<AIKeywordData[]> {
    // Return mock data if no API key
    if (this.useMockData) {
      return keywords.map(keyword => ({
        keyword,
        ai_search_volume: Math.floor(Math.random() * 5000) + 100,
        trend: Array(12).fill(0).map(() => Math.floor(Math.random() * 1000)),
        platforms: ['ChatGPT', 'Google AI', 'Perplexity'],
      }));
    }

    try {
      const payload = keywords.map(keyword => ({
        keyword,
        location_code: location,
        language_code: language,
      }));

      // Using SERP API for keyword data as AI endpoints might not be available yet
      const response = await fetch(`${BASE_URL}/serp/google/organic/task_post`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const data: DataForSEOResponse = await response.json();

      if (data.status_code === 200 && data.tasks?.[0]?.result) {
        return data.tasks[0].result.map((item: any) => ({
          keyword: item.keyword,
          ai_search_volume: item.search_volume || 0,
          trend: item.monthly_searches || [],
          platforms: item.platforms || [],
        }));
      }

      return [];
    } catch (error) {
      console.error('DataForSEO AI Keyword Error:', error);
      return [];
    }
  }

  // Get LLM responses to test visibility
  async getLLMResponses(
    prompt: string,
    models: string[] = ['gpt-4', 'claude-3', 'gemini-pro', 'perplexity']
  ): Promise<LLMResponse[]> {
    // Return mock data if no API key
    if (this.useMockData) {
      return models.map(model => ({
        prompt,
        model,
        response: `Mock AI response for ${prompt} from ${model}. Your website provides excellent services in this area.`,
        citations: [
          'https://example.com/services',
          'https://competitor1.com/products',
          'https://example.com/about',
        ],
        confidence: 0.75 + Math.random() * 0.2,
        sentiment: Math.random() > 0.3 ? 'positive' : 'neutral',
      }));
    }

    try {
      const responses: LLMResponse[] = [];

      for (const model of models) {
        const payload = [{
          prompt,
          model,
          include_citations: true,
        }];

        // Using regular SERP endpoint as AI summary might not be available
        const response = await fetch(`${BASE_URL}/serp/google/organic/task_post`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(payload),
        });

        const data: DataForSEOResponse = await response.json();

        if (data.status_code === 200 && data.tasks?.[0]?.result) {
          const result = data.tasks[0].result[0];
          responses.push({
            prompt,
            model,
            response: result.summary || result.response || '',
            citations: result.citations || [],
            confidence: result.confidence_score || 0,
            sentiment: this.analyzeSentiment(result.summary || ''),
          });
        }
      }

      return responses;
    } catch (error) {
      console.error('DataForSEO LLM Response Error:', error);
      return [];
    }
  }

  // Get AI Overview data for Google
  async getGoogleAIOverviews(keywords: string[], location = 2840): Promise<any[]> {
    // Return mock data if no API key
    if (this.useMockData) {
      return keywords.map(keyword => ({
        keyword,
        hasAIOverview: Math.random() > 0.3,
        aiOverviewContent: `AI Overview: The best ${keyword} services include several reputable providers...`,
        citations: [
          'https://example.com',
          'https://competitor1.com',
          'https://competitor2.com',
        ],
      }));
    }

    try {
      const payload = keywords.map(keyword => ({
        keyword,
        location_code: location,
        language_code: 'en',
        device: 'desktop',
      }));

      const response = await fetch(`${BASE_URL}/serp/google/organic/live/advanced`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const data: DataForSEOResponse = await response.json();

      if (data.status_code === 200 && data.tasks) {
        return data.tasks
          .filter(task => task.result?.[0]?.items)
          .map(task => {
            const items = task.result[0].items;
            const aiOverview = items.find((item: any) => item.type === 'ai_overview');
            return {
              keyword: task.data.keyword,
              hasAIOverview: !!aiOverview,
              aiOverviewContent: aiOverview?.text || null,
              citations: aiOverview?.links || [],
            };
          });
      }

      return [];
    } catch (error) {
      console.error('DataForSEO Google AI Overview Error:', error);
      return [];
    }
  }

  // Analyze sentiment of text
  private analyzeSentiment(text: string): string {
    // Simple sentiment analysis - in production, use a proper NLP library
    const positiveWords = ['best', 'excellent', 'great', 'recommended', 'top', 'leading', 'preferred'];
    const negativeWords = ['worst', 'poor', 'bad', 'avoid', 'not recommended', 'issue', 'problem'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Calculate visibility score based on citations and prominence
  calculateVisibilityScore(
    citations: string[],
    domain: string,
    position: number = -1,
    totalResults: number = 10
  ): number {
    let score = 0;

    // Check if domain is cited
    const isCited = citations.some(citation =>
      citation.toLowerCase().includes(domain.toLowerCase())
    );

    if (isCited) {
      score += 50; // Base score for being cited

      // Position bonus (if available)
      if (position > 0 && position <= 3) {
        score += 30; // Top 3 bonus
      } else if (position > 3 && position <= 5) {
        score += 20; // Top 5 bonus
      } else if (position > 5 && position <= 10) {
        score += 10; // Top 10 bonus
      }

      // Citation frequency bonus
      const citationCount = citations.filter(c =>
        c.toLowerCase().includes(domain.toLowerCase())
      ).length;
      score += Math.min(citationCount * 5, 20); // Up to 20 points for multiple citations
    }

    return Math.min(score, 100); // Cap at 100
  }

  // Get competitor analysis
  async getCompetitorVisibility(
    domain: string,
    competitors: string[],
    keywords: string[]
  ): Promise<any> {
    try {
      const allDomains = [domain, ...competitors];
      const visibilityData: any = {};

      for (const keyword of keywords) {
        const responses = await this.getLLMResponses(
          `Best services for ${keyword}`,
          ['gpt-4', 'claude-3', 'gemini-pro']
        );

        for (const targetDomain of allDomains) {
          if (!visibilityData[targetDomain]) {
            visibilityData[targetDomain] = {
              domain: targetDomain,
              totalCitations: 0,
              keywordsCited: [],
              platforms: {},
              overallScore: 0,
            };
          }

          responses.forEach(response => {
            const cited = response.citations?.some(c =>
              c.toLowerCase().includes(targetDomain.toLowerCase())
            );

            if (cited) {
              visibilityData[targetDomain].totalCitations++;
              visibilityData[targetDomain].keywordsCited.push(keyword);

              if (!visibilityData[targetDomain].platforms[response.model]) {
                visibilityData[targetDomain].platforms[response.model] = 0;
              }
              visibilityData[targetDomain].platforms[response.model]++;
            }
          });
        }
      }

      // Calculate share of voice
      const totalCitations = Object.values(visibilityData)
        .reduce((sum: number, data: any) => sum + data.totalCitations, 0);

      Object.values(visibilityData).forEach((data: any) => {
        data.shareOfVoice = totalCitations > 0
          ? (data.totalCitations / totalCitations) * 100
          : 0;
        data.overallScore = this.calculateVisibilityScore(
          data.keywordsCited,
          data.domain,
          -1,
          keywords.length * 3 // 3 platforms per keyword
        );
      });

      return visibilityData;
    } catch (error) {
      console.error('Competitor visibility error:', error);
      return {};
    }
  }
}

// Export singleton instance
export const dataForSEOClient = new DataForSEOClient();