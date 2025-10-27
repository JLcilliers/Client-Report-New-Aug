/**
 * ChatGPT (OpenAI) Visibility Testing
 */

import OpenAI from 'openai'
import {
  detectBrandMention,
  detectCitations,
  analyzeSentiment,
  calculateVisibilityScore,
  extractCompetitorMentions
} from '../utils'

export interface ChatGPTTestResult {
  platform: 'chatgpt'
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

export async function testChatGPT(
  prompt: string,
  brandName: string,
  alternateNames: string[],
  brandDomain: string | null,
  competitors: Array<{ competitorName: string; domain: string | null }>
): Promise<ChatGPTTestResult> {
  const startTime = Date.now()

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Make request to ChatGPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content || ''
    const modelVersion = completion.model || 'gpt-4-turbo-preview'

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
      platform: 'chatgpt',
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
      platform: 'chatgpt',
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
