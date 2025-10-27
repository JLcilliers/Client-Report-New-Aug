/**
 * Perplexity AI Visibility Testing
 */

import {
  detectBrandMention,
  detectCitations,
  analyzeSentiment,
  calculateVisibilityScore,
  extractCompetitorMentions
} from '../utils'

export interface PerplexityTestResult {
  platform: 'perplexity'
  prompt: string
  response: string
  brandMentioned: boolean
  position: number | null
  snippet: string | null
  cited: boolean
  citationUrls: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  visibilityScore: number
  competitorsMentioned: string[]
  testDuration: number
  modelVersion: string
  error: string | null
}

export async function testPerplexity(
  prompt: string,
  brandName: string,
  alternateNames: string[],
  brandDomain: string | null,
  competitors: Array<{ competitorName: string; domain: string | null }>
): Promise<PerplexityTestResult> {
  const startTime = Date.now()

  try {
    // Make request to Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || ''
    const modelVersion = data.model || 'llama-3.1-sonar-large-128k-online'

    // Analyze response
    const mentionResult = detectBrandMention(aiResponse, brandName, alternateNames)
    const citationResult = detectCitations(aiResponse, brandDomain)
    const sentimentResult = analyzeSentiment(aiResponse, brandName, mentionResult.snippet)
    const competitorsMentioned = extractCompetitorMentions(aiResponse, competitors)

    const visibilityScore = calculateVisibilityScore(
      mentionResult.mentioned,
      mentionResult.position,
      citationResult.cited,
      sentimentResult.score
    )

    const testDuration = Date.now() - startTime

    return {
      platform: 'perplexity',
      prompt,
      response: aiResponse,
      brandMentioned: mentionResult.mentioned,
      position: mentionResult.position,
      snippet: mentionResult.snippet,
      cited: citationResult.cited,
      citationUrls: citationResult.urls,
      sentiment: sentimentResult.sentiment,
      sentimentScore: sentimentResult.score,
      visibilityScore,
      competitorsMentioned,
      testDuration,
      modelVersion,
      error: null
    }
  } catch (error: any) {
    const testDuration = Date.now() - startTime

    return {
      platform: 'perplexity',
      prompt,
      response: '',
      brandMentioned: false,
      position: null,
      snippet: null,
      cited: false,
      citationUrls: [],
      sentiment: 'neutral',
      sentimentScore: 50,
      visibilityScore: 0,
      competitorsMentioned: [],
      testDuration,
      modelVersion: 'unknown',
      error: error.message || 'Unknown error'
    }
  }
}
