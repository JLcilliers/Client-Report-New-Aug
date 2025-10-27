/**
 * Google Gemini AI Visibility Testing
 */

import {
  detectBrandMention,
  detectCitations,
  analyzeSentiment,
  calculateVisibilityScore,
  extractCompetitorMentions
} from '../utils'

export interface GeminiTestResult {
  platform: 'gemini'
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

export async function testGemini(
  prompt: string,
  brandName: string,
  alternateNames: string[],
  brandDomain: string | null,
  competitors: Array<{ competitorName: string; domain: string | null }>
): Promise<GeminiTestResult> {
  const startTime = Date.now()

  try {
    // Use Google's Gemini REST API
    const apiKey = process.env.GOOGLE_API_KEY || process.env.PAGESPEED_API_KEY

    if (!apiKey) {
      throw new Error('Google API key not configured')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const modelVersion = 'gemini-pro'

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
      platform: 'gemini',
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
      platform: 'gemini',
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
