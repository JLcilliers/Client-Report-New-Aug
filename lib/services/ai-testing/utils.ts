/**
 * AI Brand Visibility Testing Utilities
 * Common functions for analyzing AI responses
 */

export interface BrandMentionResult {
  mentioned: boolean
  position: number | null // Position in response (1-based, null if not mentioned)
  snippet: string | null // Text snippet around the mention
  exactMatch: string | null // Which brand name/alternate matched
}

export interface CitationResult {
  cited: boolean
  urls: string[]
  citationType: 'direct' | 'indirect' | null
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number // 0-100
  reasoning: string
}

/**
 * Detect if a brand is mentioned in AI response
 */
export function detectBrandMention(
  response: string,
  brandName: string,
  alternateNames: string[] = []
): BrandMentionResult {
  const allNames = [brandName, ...alternateNames]
  const responseLower = response.toLowerCase()

  // Split response into sentences for position tracking
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0)

  for (const name of allNames) {
    const nameLower = name.toLowerCase()
    const index = responseLower.indexOf(nameLower)

    if (index !== -1) {
      // Find which sentence contains the mention
      let charCount = 0
      for (let i = 0; i < sentences.length; i++) {
        charCount += sentences[i].length + 1 // +1 for the punctuation
        if (charCount > index) {
          // Extract snippet (50 chars before and after)
          const snippetStart = Math.max(0, index - 50)
          const snippetEnd = Math.min(response.length, index + name.length + 50)
          const snippet = response.substring(snippetStart, snippetEnd)

          return {
            mentioned: true,
            position: i + 1, // 1-based position
            snippet: snippetStart > 0 ? '...' + snippet : snippet,
            exactMatch: name
          }
        }
      }

      // If we found it but couldn't determine position, still mark as mentioned
      const snippetStart = Math.max(0, index - 50)
      const snippetEnd = Math.min(response.length, index + name.length + 50)
      const snippet = response.substring(snippetStart, snippetEnd)

      return {
        mentioned: true,
        position: 1,
        snippet: snippetStart > 0 ? '...' + snippet : snippet,
        exactMatch: name
      }
    }
  }

  return {
    mentioned: false,
    position: null,
    snippet: null,
    exactMatch: null
  }
}

/**
 * Detect citations/links to brand domain
 */
export function detectCitations(
  response: string,
  brandDomain: string | null
): CitationResult {
  const urls: string[] = []

  // Extract URLs from response
  const urlRegex = /https?:\/\/[^\s\)]+/gi
  const matches = response.match(urlRegex)

  if (matches) {
    urls.push(...matches)
  }

  // Check if brand domain is cited
  if (brandDomain) {
    const domainLower = brandDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '')
    const cited = urls.some(url => {
      const urlDomain = url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '')
      return urlDomain.includes(domainLower) || domainLower.includes(urlDomain.split('/')[0])
    })

    return {
      cited,
      urls,
      citationType: cited ? 'direct' : urls.length > 0 ? 'indirect' : null
    }
  }

  return {
    cited: false,
    urls,
    citationType: urls.length > 0 ? 'indirect' : null
  }
}

/**
 * Analyze sentiment of brand mention
 * Uses keyword-based analysis
 */
export function analyzeSentiment(
  response: string,
  brandName: string,
  snippet: string | null
): SentimentResult {
  // Focus on the snippet around the brand mention if available
  const textToAnalyze = snippet || response
  const textLower = textToAnalyze.toLowerCase()

  // Positive indicators
  const positiveWords = [
    'best', 'excellent', 'great', 'outstanding', 'superior', 'leading', 'top',
    'innovative', 'reliable', 'trusted', 'recommended', 'popular', 'quality',
    'effective', 'successful', 'powerful', 'amazing', 'fantastic', 'love',
    'perfect', 'impressive', 'exceptional', 'remarkable', 'wonderful'
  ]

  // Negative indicators
  const negativeWords = [
    'worst', 'poor', 'bad', 'terrible', 'awful', 'disappointing', 'unreliable',
    'problematic', 'issues', 'concerns', 'avoid', 'not recommended', 'inferior',
    'lacking', 'limited', 'weak', 'fail', 'failed', 'disappoints', 'subpar'
  ]

  let positiveCount = 0
  let negativeCount = 0

  positiveWords.forEach(word => {
    if (textLower.includes(word)) positiveCount++
  })

  negativeWords.forEach(word => {
    if (textLower.includes(word)) negativeCount++
  })

  // Calculate sentiment
  const totalIndicators = positiveCount + negativeCount

  if (totalIndicators === 0) {
    // Neutral if no sentiment indicators
    return {
      sentiment: 'neutral',
      score: 50,
      reasoning: 'No strong sentiment indicators found'
    }
  }

  const positiveRatio = positiveCount / totalIndicators

  if (positiveRatio >= 0.6) {
    return {
      sentiment: 'positive',
      score: 60 + (positiveRatio * 40), // 60-100
      reasoning: `Found ${positiveCount} positive indicators`
    }
  } else if (positiveRatio <= 0.4) {
    return {
      sentiment: 'negative',
      score: 40 - ((1 - positiveRatio) * 40), // 0-40
      reasoning: `Found ${negativeCount} negative indicators`
    }
  } else {
    return {
      sentiment: 'neutral',
      score: 40 + (positiveRatio * 20), // 40-60
      reasoning: `Mixed sentiment with ${positiveCount} positive and ${negativeCount} negative indicators`
    }
  }
}

/**
 * Calculate overall visibility score
 */
export function calculateVisibilityScore(
  mentioned: boolean,
  position: number | null,
  cited: boolean,
  sentimentScore: number
): number {
  if (!mentioned) return 0

  // Base score for being mentioned
  let score = 30

  // Position bonus (up to 30 points)
  // Position 1 = 30 points, Position 5 = 10 points, Position 10+ = 0 points
  if (position) {
    const positionScore = Math.max(0, 30 - (position - 1) * 3)
    score += positionScore
  }

  // Citation bonus (20 points)
  if (cited) {
    score += 20
  }

  // Sentiment bonus (up to 20 points)
  // Scale sentiment score from 0-100 to 0-20
  score += (sentimentScore / 100) * 20

  return Math.min(100, Math.round(score))
}

/**
 * Extract competitor mentions from response
 */
export function extractCompetitorMentions(
  response: string,
  competitors: Array<{ competitorName: string; domain: string | null }>
): string[] {
  const mentioned: string[] = []
  const responseLower = response.toLowerCase()

  for (const competitor of competitors) {
    const nameLower = competitor.competitorName.toLowerCase()
    if (responseLower.includes(nameLower)) {
      mentioned.push(competitor.competitorName)
    }
  }

  return mentioned
}
