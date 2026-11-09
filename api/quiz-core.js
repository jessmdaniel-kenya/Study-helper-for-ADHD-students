export const MAX_NOTES_CHARS = 20_000
export const MAX_SUMMARY_CHARS = 80_000
export const MAX_ANSWER_CHARS = 2_000
export const MAX_QUESTIONS_PER_BATCH = 12
const ALLOWED_TYPES = new Set(['flashcard', 'mcq', 'written'])
const ALLOWED_MODES = new Set(['generate', 'grade', 'summarize'])
const ALLOWED_PROVIDERS = new Set(['nvidia', 'openai', 'gemini', 'anthropic', 'ollama'])
const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'among', 'because', 'been', 'being', 'between',
  'could', 'during', 'each', 'from', 'have', 'into', 'more', 'most', 'other', 'over',
  'same', 'some', 'such', 'than', 'that', 'their', 'there', 'these', 'they', 'this',
  'those', 'through', 'under', 'very', 'were', 'which', 'while', 'with', 'would',
  'your', 'and', 'are', 'for', 'not', 'the', 'was', 'when', 'where', 'what', 'then',
  'can', 'will', 'its', 'has', 'had', 'but', 'all', 'any', 'you', 'use', 'used',
])

export function validateQuizRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be an object.')
  }
  if (!ALLOWED_MODES.has(body.mode)) {
    throw new Error('Choose generate, grade, or summarize mode.')
  }
  if (typeof body.notes !== 'string' || body.notes.trim().length === 0) {
    throw new Error('Add study notes first.')
  }
  const notesLimit = body.mode === 'summarize' ? MAX_SUMMARY_CHARS : MAX_NOTES_CHARS
  if (body.notes.length > notesLimit) {
    throw new Error(`Notes are too long; the limit is ${notesLimit.toLocaleString()} characters.`)
  }

  const result = { ...body, notes: body.notes.trim() }
  if (body.provider !== undefined && body.provider !== null) {
    if (typeof body.provider !== 'object' || !ALLOWED_PROVIDERS.has(body.provider.id)) {
      throw new Error('Choose a supported AI provider.')
    }
    if ('apiKey' in body.provider || 'model' in body.provider) {
      throw new Error('Provider keys and model settings are configured on the server.')
    }
    result.provider = { id: body.provider.id }
  }
  if (body.mode === 'grade') {
    for (const field of ['question', 'reference', 'answer']) {
      if (typeof body[field] !== 'string' || body[field].length > MAX_ANSWER_CHARS) {
        throw new Error(`The ${field} must be text no longer than ${MAX_ANSWER_CHARS.toLocaleString()} characters.`)
      }
    }
  } else if (body.mode === 'generate') {
    const count = Number(body.count ?? 8)
    if (!Number.isInteger(count) || count < 1 || count > MAX_QUESTIONS_PER_BATCH) {
      throw new Error(`Question count must be a whole number from 1 to ${MAX_QUESTIONS_PER_BATCH} per batch.`)
    }
    const types = body.types === undefined ? ['mcq', 'written'] : body.types
    if (!Array.isArray(types) || types.length === 0 || types.some((type) => !ALLOWED_TYPES.has(type))) {
      throw new Error('Choose at least one supported question type.')
    }
    result.count = count
    result.types = [...new Set(types)]
  } else if (!body.provider) {
    throw new Error('Summaries require an AI provider.')
  }
  return result
}

function sentencesFrom(notes) {
  return notes
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 25)
}

function keywordsFrom(text) {
  return [...new Set(text.match(/[A-Za-z][A-Za-z'-]{3,}/g) || [])]
    .filter((word) => !STOP_WORDS.has(word.toLowerCase()))
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function answerWord(sentence) {
  return keywordsFrom(sentence).sort((a, b) => b.length - a.length)[0] || null
}

export function makeLocalQuiz(notes, count = 8, types = ['mcq', 'written']) {
  const sentences = sentencesFrom(String(notes || ''))
  const questions = []
  const allWords = keywordsFrom(sentences.join(' '))
  const safeTypes = [...new Set(types)].filter((type) => ALLOWED_TYPES.has(type))
  if (safeTypes.length === 0) throw new Error('Choose at least one supported question type.')

  for (const sentence of sentences) {
    if (questions.length >= count) break
    const term = answerWord(sentence)
    if (!term) continue
    const masked = sentence.replace(new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i'), '_____')
    let type = safeTypes[questions.length % safeTypes.length]
    let options

    if (type === 'mcq') {
      const distractors = allWords.filter((word) =>
        word.toLowerCase() !== term.toLowerCase() &&
        !new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(sentence),
      ).slice(0, 3)
      if (distractors.length < 3) {
        const alternative = safeTypes.find((candidate) => candidate !== 'mcq')
        if (!alternative) continue
        type = alternative
      } else {
        options = [term, ...distractors].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      }
    }

    const prompt = type === 'flashcard'
      ? `Explain ${term} as it is used in your notes.`
      : type === 'written'
        ? `Explain this point in your own words: “${sentence}”`
        : `Complete the sentence from your notes: “${masked}”`
    questions.push({
      type,
      prompt,
      ...(type === 'mcq' ? { options } : {}),
      answer: type === 'mcq' ? term : sentence,
      explanation: sentence,
      quote: sentence,
    })
  }

  if (questions.length === 0) {
    throw new Error('Add a few complete sentences so a local quiz can be made.')
  }
  return { questions, truncated: false, mode: 'local' }
}

export function gradeLocally(question, reference, answer) {
  const expected = new Set(keywordsFrom(`${question} ${reference}`).map((word) => word.toLowerCase()))
  const submitted = new Set(keywordsFrom(answer).map((word) => word.toLowerCase()))
  const keyTerms = [...expected].filter((word) => word.length >= 5)
  const hits = keyTerms.filter((word) => submitted.has(word)).length
  const ratio = keyTerms.length ? hits / keyTerms.length : 0
  const verdict = ratio >= 0.6 ? 'Got it' : ratio >= 0.25 ? 'Partly there' : 'Not yet'
  return {
    verdict,
    feedback: verdict === 'Got it'
      ? 'Your answer includes the main ideas from the notes.'
      : verdict === 'Partly there'
        ? 'You have part of the idea; compare your answer with the key points below.'
        : 'Try again by naming the key ideas from the notes.',
    best_fit: reference,
  }
}
