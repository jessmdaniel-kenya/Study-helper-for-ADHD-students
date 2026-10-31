import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth/mammoth.browser'
import { supabase } from '../supabase'
import { readApiResponse } from './apiResponse'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export type QuizQuestion = {
  type: 'mcq' | 'written'
  prompt: string
  options?: string[]
  answer: string
  explanation: string
  quote: string
}
export type Grade = { verdict: string; feedback: string; best_fit: string }
export type Completion = { count: number; to_next: number; reward?: { name?: string; emoji?: string } }

// Reads text out of a PDF, DOCX, TXT or MD file, in the browser.
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  let text = ''
  if (name.endsWith('.txt') || name.endsWith('.md')) {
    text = await file.text()
  } else if (name.endsWith('.docx')) {
    const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    text = r.value
  } else if (name.endsWith('.pdf')) {
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent()
      pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '))
    }
    text = pages.join('\n\n')
  } else {
    throw new Error('Please use a PDF, Word (.docx), TXT or MD file.')
  }
  if (text.trim().length < 50) {
    throw new Error('We couldn’t find readable text in that file. Scanned pages need OCR, which isn’t built yet. Try pasting the text instead.')
  }
  return text
}

// Make sure there is a (guest) session before calling Supabase or the API.
let pending: Promise<void> | null = null
export function ensureSession() {
  pending ??= (async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) await supabase.auth.signInAnonymously()
  })()
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

export const makeQuiz = (notes: string, count: number) =>
  call<{ questions: QuizQuestion[]; truncated: boolean }>({ mode: 'generate', notes, count })

export const gradeAnswer = (notes: string, q: QuizQuestion, answer: string) =>
  call<Grade>({ mode: 'grade', notes, question: q.prompt, reference: q.answer, answer })

export async function countCompletion(kind: string, ref: string): Promise<Completion | null> {
  await ensureSession()
  const { data } = await supabase.rpc('record_completion', { p_kind: kind, p_ref: ref })
  return (data as Completion) ?? null
}