# AI Visibility Research & System Design

## Executive Summary

AI Visibility (also known as LLM Visibility or Generative Engine Optimization - GEO) is the practice of tracking and optimizing how brands appear in AI-powered search results from platforms like ChatGPT, Claude, Google Gemini, Perplexity AI, and Google AI Overviews.

**Key Finding**: AI Visibility is **completely independent** from traditional SEO metrics like Google Analytics and Search Console. It requires its own separate tracking system based on prompt testing and brand mention analysis.

---

## What is AI Visibility?

### Definition
AI Visibility measures how frequently and prominently your brand appears in AI-generated responses when users ask questions related to your industry, products, or services.

### Why It Matters
- AI-powered search is replacing traditional search engines
- Users increasingly ask AI assistants for recommendations
- Brands not visible in AI responses lose potential customers
- Traditional SEO metrics don't capture AI search visibility

### Key Difference from Traditional SEO
- **Traditional SEO**: Tracks website rankings in Google search results
- **AI Visibility**: Tracks brand mentions in AI-generated answers across multiple AI platforms
- **No website required**: AI can mention brands without citing their websites

---

## AI Platforms to Track

### Primary Platforms (2024-2025)
1. **ChatGPT** (OpenAI) - Most popular AI assistant
2. **Google Gemini** - Google's AI assistant
3. **Claude** (Anthropic) - Advanced conversational AI
4. **Perplexity AI** - AI-powered search engine
5. **Google AI Overviews** (formerly SGE) - AI summaries in Google Search
6. **Microsoft Copilot** - Bing's AI integration
7. **Grok** (X/Twitter) - Twitter's AI assistant
8. **DeepSeek** - Emerging AI platform

---

## Required Data Inputs for AI Visibility Tracking

### 1. Brand Information
**Required:**
- Brand name (primary and variations)
- Company/business name
- Industry/category
- Key products/services

**Optional:**
- Brand description
- Unique value propositions
- Target audience

### 2. Domain/Website
**Purpose:**
- Track cited vs uncited mentions
- Measure link attribution
- Monitor website references

**Not Required For:**
- Basic brand mention tracking
- Competitor analysis
- Visibility scoring

### 3. Keywords & Prompts (Most Critical)
**Types of Prompts to Track:**

**Industry Questions:**
- "What are the best [product category] in [location]?"
- "Which [service] should I choose for [use case]?"
- "Compare [product type] options"

**Buying Intent Prompts:**
- "Should I buy [your product] or [competitor product]?"
- "What are alternatives to [competitor]?"
- "Best [product category] for [specific need]"

**Problem-Solution Prompts:**
- "How do I solve [problem your product addresses]?"
- "What tool/service helps with [specific challenge]?"

**Direct Brand Queries:**
- "Tell me about [your brand]"
- "Is [your brand] good?"
- "What do people think about [your brand]?"

**Recommended Start:** 10-20 highly relevant prompts covering different query types

### 4. Competitors
**Purpose:**
- Benchmark your visibility
- Track share of voice
- Identify competitive positioning
- Discover new competitors

**Recommended:** 3-10 direct competitors in your industry

### 5. Geographic Focus (Optional)
- Target markets/regions
- Language preferences
- Location-specific queries

---

## AI Visibility Metrics Explained

### 1. Overall Visibility Score (0-100)
**What it measures:** Combined metric of brand presence across all tracked prompts and platforms

**Calculation:**
- Percentage of prompts where brand appears
- Weighted by ranking position when mentioned
- Averaged across all platforms

**Example:** If your brand appears in 60% of tracked prompts with average rank of #3, your score might be 65/100

### 2. Brand Mentions
**Types:**
- **Cited Mentions:** Brand mentioned with website link
- **Uncited Mentions:** Brand mentioned without link
- **Total Mentions:** Sum of all references

**Importance:** Shows raw brand awareness in AI responses

### 3. Share of Voice (SoV)
**Formula:** (Your Brand Mentions / Total Category Mentions) × 100

**Example:** If AI mentions 5 brands total and yours appears 3 times, SoV = 60%

**Updated Metric (2025):** Now weighted by prompt search volume

### 4. Average Ranking Position
**What it tracks:** Where your brand appears in AI-generated lists

**Scoring:**
- Position 1: 100% visibility score
- Position 2: 90% visibility score
- Position 3: 80% visibility score
- Position 4-10: Decreasing scores
- Not mentioned: 0%

### 5. Citation Frequency
**Measures:**
- How often AI links to your website
- Source attribution quality
- Link placement in responses

**Critical for:** Driving actual traffic from AI platforms

### 6. Sentiment Score
**Categories:**
- Positive: 80-100 (praised, recommended, highlighted)
- Neutral: 40-60 (mentioned factually)
- Negative: 0-20 (criticized, warned against)

**Analysis:** Evaluates tone and context of brand mentions

### 7. Platform-Specific Scores
**Individual metrics for each AI platform:**
- ChatGPT visibility score
- Claude visibility score
- Gemini visibility score
- Perplexity visibility score
- Google AI Overviews score

**Why separate?** Each platform has different training data and behaviors

### 8. Competitor Comparison Metrics
- Visibility gap vs competitors
- Head-to-head mention frequency
- Context where competitors appear instead of you

### 9. Query Type Performance
**Breakdown by:**
- Informational queries
- Commercial intent queries
- Navigational queries
- Comparison queries

### 10. Temporal Metrics
- Week-over-week changes
- Month-over-month trends
- Seasonal patterns
- After-content-update impacts

---

## How AI Visibility is Measured

### Methodology

**1. Prompt Testing**
- Submit tracked prompts to each AI platform
- Parse and analyze responses
- Identify brand mentions
- Record ranking positions
- Measure citation presence

**2. Frequency:**
- Daily automated testing recommended
- Minimum: Weekly testing
- Real-time for critical prompts

**3. Analysis:**
- Natural Language Processing (NLP) for sentiment
- Position tracking in response text
- Link detection and validation
- Competitor co-mention analysis

---

## What You DON'T Need for AI Visibility

### ❌ Not Required:
- Google Analytics access
- Google Search Console access
- Website traffic data
- Traditional keyword rankings
- Backlink data
- Domain authority
- Page speed metrics

### ✅ What Actually Matters:
- Brand name
- Industry keywords
- Competitor names
- Testing prompts across AI platforms
- Monitoring AI responses

---

## Recommended Setup Flow

### Phase 1: Initial Setup (5-10 minutes)
1. Enter brand name and variations
2. Add company domain (optional but recommended)
3. Select industry category
4. Add 3-5 main competitors

### Phase 2: Keyword Strategy (15-20 minutes)
1. Add 5 direct brand queries
2. Add 5 industry/category questions
3. Add 5 buying-intent prompts
4. Add 5 competitor comparison queries

### Phase 3: Platform Selection
1. Select AI platforms to track:
   - ✅ ChatGPT (essential)
   - ✅ Google AI Overviews (essential)
   - ✅ Perplexity AI (recommended)
   - ✅ Gemini (recommended)
   - ✅ Claude (optional but valuable)

### Phase 4: Baseline Collection (24-48 hours)
1. System runs initial tests
2. Establishes baseline scores
3. Identifies current visibility gaps

### Phase 5: Ongoing Monitoring
1. Daily/weekly automated testing
2. Alert on significant changes
3. Track optimization impact

---

## Competitive Landscape - Existing Tools

### Major AI Visibility Platforms:

**1. Otterly.AI**
- Tracks all major platforms
- Citation monitoring
- Competitor tracking

**2. Semrush AI Visibility Tool**
- Part of Semrush suite
- AI Visibility Index
- Competitive benchmarking

**3. SE Ranking AI Visibility Tracker**
- Multi-platform tracking
- Sentiment analysis
- Keyword monitoring

**4. Writesonic GEO**
- "Ahrefs for AI platforms"
- Competitor analysis
- Content optimization

**5. Ahrefs Brand Radar**
- Brand mention tracking
- Citation monitoring
- New competitor discovery

**6. LLMrefs**
- Focused on citations
- Link attribution
- Source tracking

**7. Answer Socrates LLM Brand Tracker**
- Free for ChatGPT & Gemini
- Paid for Claude, Perplexity
- Starting at $9/month

**8. Profound**
- Real-time monitoring
- Multi-model tracking
- Optimization recommendations

---

## Recommended Architecture for Our System

### Option 1: Standalone AI Visibility Module

**Pros:**
- Complete independence from client reports
- Simplified setup (no Google account required)
- Focused on AI metrics only
- Easier to scale

**Cons:**
- Separate data management
- Potential for data duplication if brands are also clients

**Structure:**
```
/admin/ai-brands
  └── /new              (Setup wizard)
  └── /[brandId]        (Brand dashboard)
      ├── /overview     (Visibility scores)
      ├── /platforms    (Platform breakdown)
      ├── /keywords     (Prompt performance)
      ├── /competitors  (Competitive analysis)
      └── /settings     (Edit brand info)
```

### Option 2: Hybrid Approach

**Pros:**
- Can link to existing client reports (optional)
- Leverage existing brand data where available
- Single brand database

**Cons:**
- More complex setup flow
- Risk of confusion between SEO and AI metrics

**Structure:**
```
/admin/brands
  └── /[brandId]
      ├── /seo-reports   (Traditional reports)
      └── /ai-visibility (AI tracking)
```

### Recommended: **Option 1 - Standalone Module**

**Rationale:**
- Clearer separation of concerns
- Not all AI visibility clients will have Google access
- Different pricing models possible
- Simpler user mental model

---

## Database Schema Design

### AIBrand Table
```typescript
model AIBrand {
  id                String    @id @default(cuid())
  brandName         String    // Primary brand name
  alternateNames    String[]  // Brand variations
  domain            String?   // Optional website
  industry          String
  description       String?

  // Relations
  keywords          AIKeyword[]
  competitors       AICompetitor[]
  visibilityScores  AIVisibilityScore[]
  mentions          AIMention[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  userId            String    // Owner
  user              User      @relation(fields: [userId], references: [id])
}
```

### AIKeyword Table
```typescript
model AIKeyword {
  id          String    @id @default(cuid())
  brandId     String
  brand       AIBrand   @relation(fields: [brandId], references: [id])

  prompt      String    // The actual query
  category    String    // informational, commercial, comparison, etc.
  priority    String    // high, medium, low

  // Performance metrics
  mentions    AIMention[]
  avgPosition Float?
  lastChecked DateTime?

  createdAt   DateTime  @default(now())
  isActive    Boolean   @default(true)
}
```

### AICompetitor Table
```typescript
model AICompetitor {
  id             String    @id @default(cuid())
  brandId        String
  brand          AIBrand   @relation(fields: [brandId], references: [id])

  competitorName String
  domain         String?

  mentions       AIMention[]
  visibilityScores AIVisibilityScore[]

  createdAt      DateTime  @default(now())
}
```

### AIMention Table
```typescript
model AIMention {
  id            String    @id @default(cuid())
  brandId       String
  brand         AIBrand   @relation(fields: [brandId], references: [id])

  keywordId     String
  keyword       AIKeyword @relation(fields: [keywordId], references: [id])

  platform      String    // chatgpt, claude, gemini, perplexity, google_ai
  response      String    // Full AI response
  position      Int?      // 1-based ranking if in list
  isCited       Boolean   // Has website link?
  citationUrl   String?

  sentiment     String    // positive, neutral, negative
  sentimentScore Int      // 0-100

  context       String    // Surrounding text
  competitors   Json      // Other brands mentioned

  testedAt      DateTime  @default(now())
}
```

### AIVisibilityScore Table
```typescript
model AIVisibilityScore {
  id              String    @id @default(cuid())
  brandId         String
  brand           AIBrand   @relation(fields: [brandId], references: [id])

  platform        String    // overall, chatgpt, claude, etc.

  // Core metrics
  overallScore    Int       // 0-100
  visibilityRate  Float     // % of prompts where mentioned
  avgPosition     Float     // Average ranking position
  citationRate    Float     // % of mentions with links
  shareOfVoice    Float     // % vs competitors
  sentimentScore  Int       // Weighted average sentiment

  totalPrompts    Int
  totalMentions   Int
  citedMentions   Int

  // Temporal
  period          String    // daily, weekly, monthly
  date            DateTime

  createdAt       DateTime  @default(now())
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create database schema
- [ ] Build brand setup wizard
- [ ] Create keyword management UI
- [ ] Add competitor management
- [ ] Build basic dashboard layout

### Phase 2: Testing Infrastructure (Week 3-4)
- [ ] Integrate with AI platform APIs (where available)
- [ ] Build prompt testing engine
- [ ] Create response parser (NLP)
- [ ] Implement mention detection
- [ ] Build citation tracker

### Phase 3: Analytics & Scoring (Week 5-6)
- [ ] Calculate visibility scores
- [ ] Build sentiment analysis
- [ ] Create share of voice calculations
- [ ] Develop ranking algorithms
- [ ] Build comparison metrics

### Phase 4: Dashboard & Reporting (Week 7-8)
- [ ] Platform breakdown charts
- [ ] Keyword performance tables
- [ ] Competitor comparison views
- [ ] Trend visualizations
- [ ] Export/reporting features

### Phase 5: Automation & Alerts (Week 9-10)
- [ ] Scheduled testing (cron jobs)
- [ ] Alert system for changes
- [ ] Automated reporting
- [ ] API endpoints for integrations

---

## API Integration Options

### Direct AI Platform APIs

**ChatGPT API (OpenAI)**
- ✅ Available
- Cost: Pay per token
- Rate limits apply
- Can automate testing

**Claude API (Anthropic)**
- ✅ Available
- Cost: Pay per token
- Rate limits apply
- Can automate testing

**Gemini API (Google)**
- ✅ Available
- Cost: Free tier + paid
- Rate limits apply
- Can automate testing

**Perplexity API**
- ✅ Available (Beta)
- Cost: Pay per request
- Limited access
- Can automate testing

**Google AI Overviews**
- ❌ No direct API
- Requires web scraping
- Manual testing or browser automation

### Alternative: Browser Automation
- Use Playwright/Puppeteer
- Simulate real user queries
- Extract responses
- More expensive (time-wise)
- Backup for platforms without APIs

---

## Cost Considerations

### API Costs (Estimated Monthly for 100 prompts/day)

**ChatGPT (GPT-4o):**
- ~$50-100/month for testing volume

**Claude (Claude 3):**
- ~$50-100/month for testing volume

**Gemini:**
- Free tier: 60 requests/minute
- Paid: ~$20-50/month

**Perplexity:**
- $20-40/month for API access

**Total Monthly API Cost:** $150-300/month for comprehensive tracking

### Scaling Costs:
- More brands: Linear increase
- More keywords: Linear increase
- More frequent testing: Proportional increase

---

## Competitive Pricing Reference

**Existing Tools Pricing:**
- Answer Socrates: $9/month (limited)
- SE Ranking AI Tracker: $39-$99/month
- Otterly.AI: $49-$199/month
- Writesonic GEO: $99-$299/month
- Semrush AI Visibility: Part of $139+/month plans
- Ahrefs Brand Radar: Part of $129+/month plans

---

## Key Success Metrics for Our System

### User Experience:
- Time to first visibility score < 2 minutes
- Setup completion rate > 80%
- Daily active usage rate

### Data Quality:
- Testing reliability > 99%
- Response parsing accuracy > 95%
- Mention detection precision > 90%

### Business Metrics:
- User retention month-over-month
- Average brands tracked per user
- Keyword count per brand

---

## Next Steps - Implementation Decision

### Questions to Answer:

1. **Standalone or Integrated?**
   - Recommendation: Standalone module for clarity

2. **Which Platforms to Launch With?**
   - Recommendation: ChatGPT + Google AI Overviews (most impactful)
   - Phase 2: Add Gemini + Perplexity
   - Phase 3: Add Claude + others

3. **API vs Browser Automation?**
   - Recommendation: APIs for ChatGPT, Claude, Gemini
   - Browser automation for Google AI Overviews

4. **Pricing Model?**
   - Free tier: 1 brand, 5 keywords, weekly testing
   - Basic: $29/month - 3 brands, 20 keywords, daily testing
   - Pro: $79/month - 10 brands, 100 keywords, daily testing
   - Enterprise: Custom - unlimited, hourly testing

5. **MVP Feature Set?**
   - Brand setup wizard
   - Keyword management (10 prompts)
   - ChatGPT + Google AI Overviews only
   - Basic visibility score
   - Simple dashboard
   - Weekly automated testing

---

## Conclusion

AI Visibility is a **completely separate discipline** from traditional SEO, requiring:

✅ **Different Data:** Brand name, keywords, competitors (NOT Analytics/Search Console)
✅ **Different Platforms:** AI assistants (NOT Google Search)
✅ **Different Metrics:** Mentions, citations, sentiment (NOT traffic, rankings)
✅ **Different Strategy:** Content optimization for AI (NOT traditional SEO)

**Recommendation:** Build as a standalone module with optional linking to existing client reports, but maintain complete independence in data collection and analysis.

---

**Document Version:** 1.0
**Date:** October 27, 2024
**Author:** AI Visibility Research Team
