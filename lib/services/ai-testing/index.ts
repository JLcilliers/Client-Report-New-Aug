/**
 * AI Brand Visibility Testing Service
 * Main orchestrator for testing brand visibility across AI platforms
 */

import { testChatGPT, ChatGPTTestResult } from './platforms/chatgpt'
import { testClaude, ClaudeTestResult } from './platforms/claude'
import { testPerplexity, PerplexityTestResult } from './platforms/perplexity'
import { testGemini, GeminiTestResult } from './platforms/gemini'

export type PlatformTestResult =
  | ChatGPTTestResult
  | ClaudeTestResult
  | PerplexityTestResult
  | GeminiTestResult

export interface BrandTestConfig {
  brandId: string
  brandName: string
  alternateNames: string[]
  domain: string | null
  keywords: Array<{
    id: string
    prompt: string
    category: string
  }>
  competitors: Array<{
    id: string
    competitorName: string
    domain: string | null
  }>
  platforms: string[] // ['chatgpt', 'claude', 'gemini', 'perplexity', 'google_ai']
}

export interface TestResults {
  brandId: string
  results: PlatformTestResult[]
  summary: {
    totalTests: number
    totalMentions: number
    averageVisibilityScore: number
    averagePosition: number
    citationRate: number
    averageSentiment: number
  }
}

/**
 * Run visibility tests across selected AI platforms
 */
export async function runVisibilityTests(
  config: BrandTestConfig
): Promise<TestResults> {
  const results: PlatformTestResult[] = []

  // Test each keyword on each enabled platform
  for (const keyword of config.keywords) {
    // Run tests in parallel for all platforms
    const platformTests = config.platforms.map(async (platform) => {
      try {
        switch (platform) {
          case 'chatgpt':
            return await testChatGPT(
              keyword.prompt,
              config.brandName,
              config.alternateNames,
              config.domain,
              config.competitors
            )

          case 'claude':
            return await testClaude(
              keyword.prompt,
              config.brandName,
              config.alternateNames,
              config.domain,
              config.competitors
            )

          case 'perplexity':
            return await testPerplexity(
              keyword.prompt,
              config.brandName,
              config.alternateNames,
              config.domain,
              config.competitors
            )

          case 'gemini':
            return await testGemini(
              keyword.prompt,
              config.brandName,
              config.alternateNames,
              config.domain,
              config.competitors
            )

          default:
            return null
        }
      } catch (error: any) {
        return null
      }
    })

    // Wait for all platform tests to complete
    const platformResults = await Promise.all(platformTests)

    // Add non-null results
    results.push(...platformResults.filter((r): r is PlatformTestResult => r !== null))
  }

  // Calculate summary statistics
  const totalTests = results.length
  const totalMentions = results.filter(r => r.brandMentioned).length
  const mentionedResults = results.filter(r => r.brandMentioned)

  const averageVisibilityScore = totalTests > 0
    ? results.reduce((sum, r) => sum + r.visibilityScore, 0) / totalTests
    : 0

  const averagePosition = mentionedResults.length > 0
    ? mentionedResults.reduce((sum, r) => sum + (r.position || 0), 0) / mentionedResults.length
    : 0

  const citationRate = totalMentions > 0
    ? (results.filter(r => r.cited).length / totalMentions) * 100
    : 0

  const averageSentiment = totalTests > 0
    ? results.reduce((sum, r) => sum + r.sentimentScore, 0) / totalTests
    : 50

  return {
    brandId: config.brandId,
    results,
    summary: {
      totalTests,
      totalMentions,
      averageVisibilityScore,
      averagePosition,
      citationRate,
      averageSentiment
    }
  }
}

/**
 * Calculate platform-specific scores from test results
 */
export function calculatePlatformScores(results: PlatformTestResult[]) {
  const platformGroups = new Map<string, PlatformTestResult[]>()

  // Group results by platform
  for (const result of results) {
    const platform = result.platform
    if (!platformGroups.has(platform)) {
      platformGroups.set(platform, [])
    }
    platformGroups.get(platform)!.push(result)
  }

  // Calculate scores for each platform
  const platformScores = []

  for (const [platform, platformResults] of Array.from(platformGroups.entries())) {
    const totalTests = platformResults.length
    const totalMentions = platformResults.filter(r => r.brandMentioned).length
    const citedMentions = platformResults.filter(r => r.cited).length

    const visibilityRate = totalTests > 0 ? (totalMentions / totalTests) * 100 : 0
    const citationRate = totalMentions > 0 ? (citedMentions / totalMentions) * 100 : 0

    const mentionedResults = platformResults.filter(r => r.brandMentioned)
    const avgPosition = mentionedResults.length > 0
      ? mentionedResults.reduce((sum, r) => sum + (r.position || 0), 0) / mentionedResults.length
      : 0

    const avgSentiment = totalTests > 0
      ? platformResults.reduce((sum, r) => sum + r.sentimentScore, 0) / totalTests
      : 50

    const overallScore = totalTests > 0
      ? platformResults.reduce((sum, r) => sum + r.visibilityScore, 0) / totalTests
      : 0

    platformScores.push({
      platform,
      overallScore,
      visibilityRate,
      avgPosition,
      citationRate,
      sentimentScore: avgSentiment,
      totalTests,
      totalMentions,
      citedMentions
    })
  }

  return platformScores
}
