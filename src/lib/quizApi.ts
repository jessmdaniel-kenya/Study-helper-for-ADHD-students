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

export type QuizProvider = 'deepseek' | 'nvidia'
export type QuizProviderConfig = {
  id: QuizProvider
  apiKey: string
  model: string
}

async function call<T>(body: Record<string, unknown>, provider?: QuizProviderConfig): Promise<T> {
  const response = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, ...(provider ? { provider } : {}) }),
  })
  return readApiResponse<T>(response)
}

export const makeQuiz = (
  notes: string,
  count: number,
  types: QuizType[] = ['mcq', 'written'],
  provider?: QuizProviderConfig,
) =>
  call<{ questions: QuizQuestion[]; truncated: boolean }>({ mode: 'generate', notes, count, types }, provider)

export const gradeAnswer = (notes: string, q: QuizQuestion, answer: string, provider?: QuizProviderConfig) =>
  call<Grade>({ mode: 'grade', notes, question: q.prompt, reference: q.answer, answer }, provider)
