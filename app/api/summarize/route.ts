import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface SummarizeRequest {
  input: string
}

interface LearningCardResponse {
  header: string
  whatItIs: string
  whyItMatters: string
  sourceUrl: string | null
  sourceType: 'url' | 'text'
}

const SYSTEM_PROMPT = `You are a clinical, hype-free learning assistant. Your job is to transform noisy, marketing-heavy content into clear, actionable learning cards.

CONSTRAINTS:
1. HEADER: Extract the core topic, repository name, paper title, or concept. Be specific. No buzzwords.
2. WHAT IT IS: One sentence. What is this thing, technically? Strip all marketing language.
3. WHY IT MATTERS: One sentence. What practical problem does it solve, or what capability does it enable? Be concrete.

TONE REQUIREMENTS:
- Clinical and factual, like a technical specification
- No hype words: "revolutionary", "game-changing", "breakthrough", "amazing", "incredible"
- No marketing phrases: "the future of", "next-generation", "cutting-edge"
- No emotional manipulation: "you won't believe", "finally", "at last"
- If the original content is mostly hype with little substance, say so directly in the summary

OUTPUT FORMAT (JSON):
{
  "header": "string",
  "whatItIs": "string",
  "whyItMatters": "string"
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
      // Fallback: Generate a mock response for demo purposes
      console.warn('No OPENAI_API_KEY found, using mock response')
      return NextResponse.json(generateMockResponse(input))
    }

    const openai = new OpenAI({ apiKey })

    const trimmedInput = input.trim()
    const detectedUrl = extractUrl(trimmedInput)
    const sourceType = isValidUrl(trimmedInput) || detectedUrl ? 'url' : 'text'
    const sourceUrl = isValidUrl(trimmedInput) ? trimmedInput : detectedUrl

    const userMessage = sourceType === 'url'
      ? `Analyze this URL and create a learning card: ${trimmedInput}`
      : `Analyze this content and create a learning card:\n\n${trimmedInput}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No response from LLM')
    }

    const parsed = JSON.parse(responseText)

    const response: LearningCardResponse = {
      header: parsed.header || 'Unknown Topic',
      whatItIs: parsed.whatItIs || 'Unable to extract description.',
      whyItMatters: parsed.whyItMatters || 'Unable to determine significance.',
      sourceUrl,
      sourceType
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

// Mock response generator for demo/development without API key
function generateMockResponse(input: string): LearningCardResponse {
  const trimmedInput = input.trim()
  const detectedUrl = extractUrl(trimmedInput)
  const sourceType = isValidUrl(trimmedInput) || detectedUrl ? 'url' : 'text'
  const sourceUrl = isValidUrl(trimmedInput) ? trimmedInput : detectedUrl

  // Simple heuristic-based mock
  let header = 'Topic from Input'
  let whatItIs = 'A piece of content that was submitted for analysis.'
  let whyItMatters = 'It contains information relevant to AI/ML developments.'

  // Try to extract some meaning from the input
  if (trimmedInput.toLowerCase().includes('github')) {
    header = 'GitHub Repository'
    whatItIs = 'An open-source project or code repository.'
    whyItMatters = 'Provides reusable code or demonstrates implementation patterns.'
  } else if (trimmedInput.toLowerCase().includes('paper') || trimmedInput.toLowerCase().includes('arxiv')) {
    header = 'Research Paper'
    whatItIs = 'An academic or technical research publication.'
    whyItMatters = 'Introduces new methods, findings, or theoretical frameworks.'
  } else if (trimmedInput.toLowerCase().includes('gpt') || trimmedInput.toLowerCase().includes('llm')) {
    header = 'LLM-Related Content'
    whatItIs = 'Content about large language models or AI assistants.'
    whyItMatters = 'Relevant to understanding or applying language model technology.'
  } else if (trimmedInput.length > 100) {
    // Extract first meaningful phrase as header
    const firstLine = trimmedInput.split('\n')[0].slice(0, 60)
    header = firstLine.length > 50 ? firstLine.slice(0, 50) + '...' : firstLine
    whatItIs = 'User-submitted text content for processing.'
    whyItMatters = 'Contains information the user wants to distill into a learning card.'
  }

  return {
    header,
    whatItIs,
    whyItMatters,
    sourceUrl,
    sourceType
  }
}
