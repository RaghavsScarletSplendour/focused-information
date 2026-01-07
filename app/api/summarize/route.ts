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

    const userMessage = sourceUrl
      ? `Analyze this URL and create a learning card: ${trimmedInput}`
      : `Analyze this content and create a learning card:\n\n${trimmedInput}`

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
