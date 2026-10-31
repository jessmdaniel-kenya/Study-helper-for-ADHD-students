import { supabase } from './supabase' // (adjust path as needed)
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

// Make sure there is a (guest) session before calling the API.
let pending: Promise<void> | null = null
function ensureSession() {
  pending ??= (async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) throw error
    }
  })().catch((e) => {
    pending = null
    throw e
  })
  return pending
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  await ensureSession()
  const { data: { session } } = await supabase.auth.getSession()
  const r = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify(body),
  })
  return readApiResponse<T>(r)
}

export const makeQuiz = (notes: string, count: number, types: QuizType[]) =>
  call<{ questions: QuizQuestion[]; truncated: boolean }>({ mode: 'generate', notes, count, types })

export const gradeAnswer = (notes: string, q: QuizQuestion, answer: string) =>
  call<Grade>({ mode: 'grade', notes, question: q.prompt, reference: q.answer, answer })