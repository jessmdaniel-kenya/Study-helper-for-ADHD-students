// src/lib/extractor.ts
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth/mammoth.browser'
import Tesseract from 'tesseract.js'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

// 1. Reads the text out of a PDF, Word (.docx), TXT, MD, or Image file in the browser.
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  let text = ''

  if (file.type.startsWith('image/')) {
    // Read the text directly out of the image
    const result = await Tesseract.recognize(file, 'eng')
    text = result.data.text
  } else if (name.endsWith('.txt') || name.endsWith('.md')) {
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
    throw new Error('Please use a PDF, Word (.docx), TXT, MD, or Image file. Older .doc files need saving as .docx first.')
  }

  if (text.trim().length < 50) {
    throw new Error('We couldn’t find readable text in that file.')
  }
  return text
}

// 2. Types for your Study Engine
export type QuizQuestion = {
  type: 'mcq' | 'written'
  prompt: string
  options?: string[]
  answer: string
  explanation: string
  quote: string
}

// 3. 100% Local Quiz Generation Engine (No network calls, works instantly offline)
export const makeQuiz = async (notes: string, count: number): Promise<{ questions: QuizQuestion[]; truncated: boolean }> => {
  const sentences = notes
    .split(/[\.\?\!]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)

  const questions: QuizQuestion[] = []
  
  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sentence = sentences[i]
    const isMcq = i % 2 === 0

    questions.push({
      type: isMcq ? 'mcq' : 'written',
      prompt: isMcq 
        ? `Which of the following best reflects or relates to this concept: "${sentence.slice(0, 60)}..."?`
        : `Explain or define the key principle regarding: "${sentence.slice(0, 60)}..."`,
      options: isMcq ? [
        sentence.slice(0, 50),
        'Alternative theoretical framework',
        'Secondary structural constraint',
        'None of the above'
      ].sort(() => Math.random() - 0.5) : undefined,
      answer: sentence,
      explanation: 'Extracted directly from your study materials via local analysis.',
      quote: sentence
    })
  }

  if (questions.length === 0) {
    questions.push({
      type: 'written',
      prompt: 'Summarize the core structural definition from your study notes.',
      answer: notes.slice(0, 150),
      explanation: 'General review item.',
      quote: notes.slice(0, 50)
    })
  }

  return { questions, truncated: false }
}

// 4. Local Grading Engine
export const gradeAnswer = async (_notes: string, q: QuizQuestion, answer: string) => {
  const isCorrect = answer.toLowerCase().includes(q.answer.toLowerCase().slice(0, 15))
  return {
    verdict: isCorrect ? 'Correct' : 'Needs Review',
    feedback: isCorrect ? 'Great job matching the source text!' : `Reference answer: ${q.answer}`,
    best_fit: q.answer
  }
}