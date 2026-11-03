import { supabase, supabaseConfigured } from './supabase'
import { ensureSession } from './auth'
import { readApiResponse } from './apiResponse'

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

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const session = supabaseConfigured ? await ensureSession() : null
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (session) headers.authorization = `Bearer ${session.access_token}`
  const response = await fetch('/api/quiz', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return readApiResponse<T>(response)
}

export const makeQuiz = (notes: string, count: number, types: QuizType[] = ['mcq', 'written']) =>
  call<{ questions: QuizQuestion[]; truncated: boolean }>({ mode: 'generate', notes, count, types })

export const gradeAnswer = (notes: string, q: QuizQuestion, answer: string) =>
  call<Grade>({ mode: 'grade', notes, question: q.prompt, reference: q.answer, answer })