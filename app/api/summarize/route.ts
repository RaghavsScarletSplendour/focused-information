import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface SummarizeRequest {
  input: string
}

interface SummarizeResponse {
  header: string
  summary: string
  sourceUrl: string | null
}

const SYSTEM_PROMPT = `You are a clinical, hype-free learning assistant. Transform noisy content into clear learning cards.

CONSTRAINTS:
1. HEADER: Extract the core topic, repository name, paper title, or concept. Be specific. No buzzwords.
2. SUMMARY: Exactly 2 lines. Line 1: What is this, technically? Line 2: What practical problem does it solve?

TONE:
- Clinical and factual, like a technical specification
- Strip all hype: "revolutionary", "game-changing", "breakthrough", "amazing"
- Strip all marketing: "the future of", "next-generation", "cutting-edge"
- If the content is mostly hype with little substance, say so directly

OUTPUT FORMAT (JSON):
{
  "header": "string",
  "summary": "string (exactly 2 lines separated by newline)"
}

Respond ONLY with valid JSON. No additional text.`

const FETCH_TIMEOUT = 10000 // 10 seconds
const MAX_CONTENT_LENGTH = 4000 // chars to send to GPT

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function extractUrl(input: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/gi
  const matches = input.match(urlRegex)
  return matches ? matches[0] : null
}

function getUrlType(url: string): 'x.com' | 'general' | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'x.com') return 'x.com'
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return 'general'
    return null
  } catch {
    return null
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchWithJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`
  const response = await fetchWithTimeout(jinaUrl, {
    headers: { 'Accept': 'text/plain' }
  })

  if (!response.ok) {
    throw new Error(`Jina fetch failed: ${response.status}`)
  }

  const text = await response.text()
  return text.slice(0, MAX_CONTENT_LENGTH)
}

async function fetchXPost(url: string): Promise<string> {
  // x.com/user/status/123 → api.fxtwitter.com/user/status/123
  const apiUrl = url.replace('x.com', 'api.fxtwitter.com')
  const response = await fetchWithTimeout(apiUrl)

  if (!response.ok) {
    throw new Error(`FxTwitter fetch failed: ${response.status}`)
  }

  const data = await response.json()
  const tweet = data.tweet

  if (!tweet) {
    throw new Error('No tweet data in response')
  }

  // Format tweet data for the LLM
  let content = `Tweet by @${tweet.author?.screen_name || 'unknown'}:\n${tweet.text || ''}`

  if (tweet.media?.photos?.length) {
    content += `\n[Contains ${tweet.media.photos.length} image(s)]`
  }
  if (tweet.media?.videos?.length) {
    content += `\n[Contains ${tweet.media.videos.length} video(s)]`
  }

  content += `\nLikes: ${tweet.likes || 0}, Retweets: ${tweet.retweets || 0}`

  return content
}

async function fetchUrlContent(url: string): Promise<string | null> {
  const urlType = getUrlType(url)

  if (!urlType) return null

  try {
    if (urlType === 'x.com') {
      return await fetchXPost(url)
    } else {
      return await fetchWithJina(url)
    }
  } catch (error) {
    console.warn(`Failed to fetch URL content: ${error}`)
    return null // Fall back to URL-only mode
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json()
    const { input } = body

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.warn('No OPENAI_API_KEY found, using mock response')
      return NextResponse.json(generateMockResponse(input))
    }

    const openai = new OpenAI({ apiKey })

    const trimmedInput = input.trim()
    const detectedUrl = extractUrl(trimmedInput)
    const sourceUrl = isValidUrl(trimmedInput) ? trimmedInput : detectedUrl

    // Fetch URL content if a URL is detected
    let contentToAnalyze = trimmedInput
    if (sourceUrl) {
      const fetchedContent = await fetchUrlContent(sourceUrl)
      if (fetchedContent) {
        contentToAnalyze = fetchedContent
        console.log(`Fetched content for ${sourceUrl} (${fetchedContent.length} chars)`)
      }
    }

    const userMessage = `Analyze this content and create a learning card:\n\n${contentToAnalyze}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No response from LLM')
    }

    const parsed = JSON.parse(responseText)

    const response: SummarizeResponse = {
      header: parsed.header || 'Unknown Topic',
      summary: parsed.summary || 'Unable to extract summary.',
      sourceUrl
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Summarize error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse LLM response' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process input. Please try again.' },
      { status: 500 }
    )
  }
}

function generateMockResponse(input: string): SummarizeResponse {
  const trimmedInput = input.trim()
  const detectedUrl = extractUrl(trimmedInput)
  const sourceUrl = isValidUrl(trimmedInput) ? trimmedInput : detectedUrl

  let header = 'Topic from Input'
  let summary = 'A piece of content submitted for analysis.\nContains information relevant to AI/ML developments.'

  if (trimmedInput.toLowerCase().includes('github')) {
    header = 'GitHub Repository'
    summary = 'An open-source project or code repository.\nProvides reusable code or demonstrates implementation patterns.'
  } else if (trimmedInput.toLowerCase().includes('paper') || trimmedInput.toLowerCase().includes('arxiv')) {
    header = 'Research Paper'
    summary = 'An academic or technical research publication.\nIntroduces new methods, findings, or theoretical frameworks.'
  } else if (trimmedInput.toLowerCase().includes('gpt') || trimmedInput.toLowerCase().includes('llm')) {
    header = 'LLM-Related Content'
    summary = 'Content about large language models or AI assistants.\nRelevant to understanding or applying language model technology.'
  } else if (trimmedInput.length > 100) {
    const firstLine = trimmedInput.split('\n')[0].slice(0, 60)
    header = firstLine.length > 50 ? firstLine.slice(0, 50) + '...' : firstLine
    summary = 'User-submitted text content for processing.\nContains information the user wants to distill.'
  }

  return {
    header,
    summary,
    sourceUrl
  }
}
