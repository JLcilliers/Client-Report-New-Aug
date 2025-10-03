/**
 * Perplexity AI API Service
 * Handles queries to Perplexity for AI citation tracking
 */

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface PerplexityResponse {
  id: string
  model: string
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  citations?: string[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface CitationResult {
  query: string
  responseText: string
  citations: string[]
  brandMentioned: boolean
  citationPosition: number | null
  citedUrl: string | null
  sentiment: 'positive' | 'neutral' | 'negative'
  context: string | null
}

export class PerplexityService {
  private apiKey: string | undefined
  private baseUrl = 'https://api.perplexity.ai'

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY
  }

  /**
   * Ensure API key is configured before making requests
   */
  private ensureApiKey(): string {
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is not configured')
    }
    return this.apiKey
  }

  /**
   * Query Perplexity AI with a search query
   */
  async query(searchQuery: string): Promise<PerplexityResponse> {
    try {
      const apiKey = this.ensureApiKey()

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-reasoning',
          messages: [
            {
              role: 'user',
              content: searchQuery
            }
          ],
          return_citations: true,
          return_images: false,
          temperature: 0.2,
          top_p: 0.9
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      console.error('Error querying Perplexity:', error)
      throw new Error(`Failed to query Perplexity: ${error.message}`)
    }
  }

  /**
   * Check if a brand/domain is mentioned or cited in AI response for a keyword
   */
  async checkCitation(
    keyword: string,
    brandName: string,
    domain: string
  ): Promise<CitationResult> {
    try {
      // Query Perplexity with the keyword
      const response = await this.query(keyword)

      const responseText = response.choices[0]?.message?.content || ''
      const citations = response.citations || []

      // Check for brand mentions in response text
      const brandMentioned = this.checkBrandMention(responseText, brandName, domain)

      // Check for domain citations
      const citationInfo = this.checkDomainCitation(citations, domain)

      // Analyze sentiment if brand is mentioned
      const sentiment = brandMentioned
        ? this.analyzeSentiment(responseText, brandName)
        : 'neutral'

      // Extract context around brand mention
      const context = brandMentioned
        ? this.extractContext(responseText, brandName, domain)
        : null

      return {
        query: keyword,
        responseText,
        citations,
        brandMentioned,
        citationPosition: citationInfo.position,
        citedUrl: citationInfo.url,
        sentiment,
        context
      }
    } catch (error: any) {
      console.error('Error checking citation:', error)
      throw error
    }
  }

  /**
   * Check multiple keywords at once
   */
  async checkMultipleCitations(
    keywords: string[],
    brandName: string,
    domain: string
  ): Promise<CitationResult[]> {
    const results: CitationResult[] = []

    // Process keywords sequentially to avoid rate limiting
    for (const keyword of keywords) {
      try {
        const result = await this.checkCitation(keyword, brandName, domain)
        results.push(result)

        // Add delay between requests to avoid rate limiting
        await this.delay(1000)
      } catch (error) {
        console.error(`Error checking keyword "${keyword}":`, error)
        // Continue with next keyword even if one fails
      }
    }

    return results
  }

  /**
   * Check if brand name or domain appears in the response text
   */
  private checkBrandMention(text: string, brandName: string, domain: string): boolean {
    const lowerText = text.toLowerCase()
    const lowerBrand = brandName.toLowerCase()
    const lowerDomain = domain.toLowerCase().replace('https://', '').replace('http://', '').replace('www.', '')

    return lowerText.includes(lowerBrand) || lowerText.includes(lowerDomain)
  }

  /**
   * Check if domain appears in citations and get position
   */
  private checkDomainCitation(citations: string[], domain: string): { position: number | null, url: string | null } {
    const cleanDomain = domain.toLowerCase().replace('https://', '').replace('http://', '').replace('www.', '')

    for (let i = 0; i < citations.length; i++) {
      const citation = citations[i].toLowerCase()
      if (citation.includes(cleanDomain)) {
        return {
          position: i + 1,
          url: citations[i]
        }
      }
    }

    return { position: null, url: null }
  }

  /**
   * Simple sentiment analysis based on context around brand mention
   */
  private analyzeSentiment(text: string, brandName: string): 'positive' | 'neutral' | 'negative' {
    const context = this.extractContext(text, brandName, brandName)
    if (!context) return 'neutral'

    const lowerContext = context.toLowerCase()

    // Positive indicators
    const positiveWords = ['best', 'excellent', 'great', 'top', 'leading', 'innovative', 'trusted', 'reliable', 'quality', 'recommended']
    const positiveCount = positiveWords.filter(word => lowerContext.includes(word)).length

    // Negative indicators
    const negativeWords = ['poor', 'bad', 'worst', 'issue', 'problem', 'complaint', 'fail', 'disappointing', 'avoid']
    const negativeCount = negativeWords.filter(word => lowerContext.includes(word)).length

    if (positiveCount > negativeCount && positiveCount > 0) return 'positive'
    if (negativeCount > positiveCount && negativeCount > 0) return 'negative'
    return 'neutral'
  }

  /**
   * Extract surrounding context (2 sentences before and after) around brand mention
   */
  private extractContext(text: string, brandName: string, domain: string): string | null {
    const sentences = text.split(/[.!?]+/)
    const lowerBrand = brandName.toLowerCase()
    const lowerDomain = domain.toLowerCase().replace('https://', '').replace('http://', '').replace('www.', '')

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].toLowerCase()
      if (sentence.includes(lowerBrand) || sentence.includes(lowerDomain)) {
        // Get 2 sentences before and after
        const start = Math.max(0, i - 2)
        const end = Math.min(sentences.length, i + 3)
        return sentences.slice(start, end).join('. ').trim()
      }
    }

    return null
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const perplexityService = new PerplexityService()
