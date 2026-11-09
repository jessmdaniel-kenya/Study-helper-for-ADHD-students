import { ensureSession } from './auth'
import { readApiResponse } from './apiResponse'
import type { EnergyLevel } from '../stores/useAppStore'

export type QuizType = 'flashcard' | 'mcq' | 'written'

export type QuizQuestion = {
  type: QuizType
  prompt: string
  options?: string[]
  answer: string
  explanation: string
  quote: string
}

export type Grade = { verdict: string; feedback: string; best_fit: string }

export type MaterialOverview = {
  overview: string
  summary: string
  summaryBlocks?: ({ type: 'heading'; level: number; text: string } | { type: 'paragraph'; text: string } | { type: 'list'; ordered: boolean; items: string[] })[]
  keyPoints: { point: string; quote: string }[]
  keyTerms: { term: string; definition: string }[]
  studyPlan: string[]
}

const MAX_QUESTIONS_PER_STUDY_SET = 100
const MAX_CHUNK_CHARS = 18_000
const MAX_CHUNK_WORDS = 2_500
const WORDS_PER_QUESTION = 250

export function questionCountForMaterial(notes: string, energyLevel: EnergyLevel | null = null) {
  const words = notes.trim().split(/\s+/).filter(Boolean).length
  const standardCount = Math.max(3, Math.ceil(words / WORDS_PER_QUESTION))
  const adjustedCount = energyLevel === 'Low'
    ? Math.max(2, Math.ceil(standardCount * 0.6))
    : energyLevel === 'Wired'
      ? Math.ceil(standardCount * 1.25)
      : standardCount
  return Math.min(MAX_QUESTIONS_PER_STUDY_SET, adjustedCount)
}

function splitMaterial(notes: string) {
  const parts = notes.split(/(?<=[.!?])\s+|\r?\n+/).map((part) => part.trim()).filter(Boolean)
  const chunks: string[] = []
  let chunk = ''
  let chunkWords = 0

  for (const part of parts.length ? parts : [notes]) {
    for (const word of part.split(/\s+/)) {
      if (word.length > MAX_CHUNK_CHARS) {
        if (chunk) chunks.push(chunk)
        chunk = ''
        chunkWords = 0
        for (let start = 0; start < word.length; start += MAX_CHUNK_CHARS) {
          chunks.push(word.slice(start, start + MAX_CHUNK_CHARS))
        }
        continue
      }
      if (chunk && (chunk.length + word.length + 1 > MAX_CHUNK_CHARS || chunkWords >= MAX_CHUNK_WORDS)) {
        chunks.push(chunk)
        chunk = ''
        chunkWords = 0
      }
      chunk = chunk ? `${chunk} ${word}` : word
      chunkWords += 1
    }
  }
  if (chunk) chunks.push(chunk)
  return chunks
}

function allocateQuestions(chunks: string[], total: number) {
  const weights = chunks.map((chunk) => chunk.trim().split(/\s+/).filter(Boolean).length)
  const words = weights.reduce((sum, weight) => sum + weight, 0)
  const allocations = weights.map((weight) => Math.floor(total * weight / words))
  let remainder = total - allocations.reduce((sum, value) => sum + value, 0)
  const order = weights
    .map((weight, index) => ({ index, fraction: (total * weight / words) % 1 }))
    .sort((a, b) => b.fraction - a.fraction)
  for (const { index } of order) {
    if (!remainder) break
    allocations[index] += 1
    remainder -= 1
  }
  return allocations
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const session = await ensureSession()
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
  const response = await fetch(`${apiBaseUrl}/api/quiz`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ ...body, provider: { id: 'nvidia' } }),
  })
  return readApiResponse<T>(response)
}

export async function makeQuiz(
  notes: string,
  types: QuizType[] = ['mcq', 'written'],
  onProgress?: (completed: number, total: number) => void,
  excludedQuotes: string[] = [],
  energyLevel: EnergyLevel | null = null,
) {
  let remainingNotes = notes.replace(/\s+/g, ' ')
  for (const quote of excludedQuotes) {
    const normalizedQuote = quote.replace(/\s+/g, ' ').trim()
    if (normalizedQuote) remainingNotes = remainingNotes.replace(new RegExp(escapeRegExp(normalizedQuote), 'gi'), ' ')
  }
  const chunks = splitMaterial(remainingNotes)
  const target = questionCountForMaterial(remainingNotes, energyLevel)
  const allocations = allocateQuestions(chunks, target)
  const questions: QuizQuestion[] = []
  const warnings: string[] = []
  const quotes = new Set<string>()
  let completed = 0
  const requested = allocations.reduce((sum, count) => sum + count, 0)

  for (let index = 0; index < chunks.length; index += 1) {
    const count = allocations[index]
    if (!count) continue
    try {
      const batch = await call<{ questions: QuizQuestion[]; truncated: boolean }>(
        { mode: 'generate', notes: chunks[index], count, types, energyLevel: energyLevel || 'Medium' },
      )
      for (const question of batch.questions) {
        const quote = question.quote.trim().toLocaleLowerCase()
        if (!quotes.has(quote)) {
          quotes.add(quote)
          questions.push(question)
        }
      }
    } catch (error) {
      if (questions.length === 0) throw error
      warnings.push(error instanceof Error ? error.message : 'Some questions could not be generated.')
      break
    }
    completed += count
    onProgress?.(completed, requested)
  }

  if (!questions.length) throw new Error('No questions could be generated from this material.')
  return { questions, truncated: questions.length < target, warnings, target }
}

export async function gradeAnswer(_notes: string, q: QuizQuestion, answer: string) {
  return call<Grade>({ mode: 'grade', notes: q.quote, question: q.prompt, reference: q.answer, answer })
}

export function summarizeMaterial(notes: string) {
  return call<MaterialOverview>({ mode: 'summarize', notes })
}
