/**
 * Claude (Anthropic) Visibility Testing
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  detectBrandMention,
  detectCitations,
  analyzeSentiment,
  calculateVisibilityScore,
  extractCompetitorMentions
} from '../utils'

export interface ClaudeTestResult {
  platform: 'claude'
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

export async function testClaude(
  prompt: string,
  brandName: string,
  alternateNames: string[],
  brandDomain: string | null,
  competitors: Array<{ competitorName: string; domain: string | null }>
): Promise<ClaudeTestResult> {
  const startTime = Date.now()

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    // Make request to Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const response = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const modelVersion = message.model || 'claude-3-5-sonnet-20241022'

    // Analyze response
    const mentionResult = detectBrandMention(response, brandName, alternateNames)
    const citationResult = detectCitations(response, brandDomain)
    const sentimentResult = analyzeSentiment(response, brandName, mentionResult.snippet)
    const competitorsMentioned = extractCompetitorMentions(response, competitors)

    const visibilityScore = calculateVisibilityScore(
      mentionResult.mentioned,
      mentionResult.position,
      citationResult.cited,
      sentimentResult.score
    )

    const testDuration = Date.now() - startTime

    return {
      platform: 'claude',
      prompt,
      response,
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
      platform: 'claude',
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
