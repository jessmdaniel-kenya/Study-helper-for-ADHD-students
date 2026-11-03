import { ensureSession } from './auth'
import { supabase, supabaseConfigured } from './supabase'

export { extractText } from './extractor'
export { ensureSession } from './auth'
export { makeQuiz, gradeAnswer } from './quizApi'
export type { QuizQuestion } from './quizApi'

export type Completion = {
  count: number
  to_next: number
  reward?: { name?: string; emoji?: string }
}

export async function countCompletion(materialId: string): Promise<Completion | null> {
  if (!supabaseConfigured) return null
  await ensureSession()
  const { data, error } = await supabase.rpc('record_completion', { p_material_id: materialId })
  if (error) throw new Error(`Could not save study progress: ${error.message}`)
  return data as Completion
}
