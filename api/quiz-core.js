export const MAX_NOTES_CHARS = 20_000
export const MAX_ANSWER_CHARS = 2_000
const ALLOWED_TYPES = new Set(['flashcard', 'mcq', 'written'])
const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'among', 'because', 'been', 'being', 'between',
  'could', 'during', 'each', 'from', 'have', 'into', 'more', 'most', 'other', 'over',
  'same', 'some', 'such', 'than', 'that', 'their', 'there', 'these', 'they', 'this',
  'those', 'through', 'under', 'very', 'were', 'which', 'while', 'with', 'would',
  'your', 'and', 'are', 'for', 'not', 'the', 'was', 'when', 'where', 'what', 'then',
  'can', 'will', 'its', 'has', 'had', 'but', 'all', 'any', 'you', 'use', 'used',
])

export function isAnthropicEnabled(env = process.env) {
  return env.AI_MODE === 'anthropic' && Boolean(env.AI_API_KEY)
}

export function validateQuizRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be an object.')
  }
  if (!['generate', 'grade'].includes(body.mode)) {
    throw new Error('Choose generate or grade mode.')
  }
  if (typeof body.notes !== 'string' || body.notes.trim().length === 0) {
    throw new Error('Add study notes first.')
  }
  if (body.notes.length > MAX_NOTES_CHARS) {
    throw new Error(`Notes are too long; the limit is ${MAX_NOTES_CHARS.toLocaleString()} characters.`)
  }

  const result = { ...body, notes: body.notes.trim() }
  if (body.mode === 'grade') {
    for (const field of ['question', 'reference', 'answer']) {
      if (typeof body[field] !== 'string' || body[field].length > MAX_ANSWER_CHARS) {
        throw new Error(`The ${field} must be text no longer than ${MAX_ANSWER_CHARS.toLocaleString()} characters.`)
      }
    }
  } else {
    const count = Number(body.count ?? 8)
    if (!Number.isInteger(count) || count < 1 || count > 12) {
      throw new Error('Question count must be a whole number from 1 to 12.')
    }
    const types = body.types === undefined ? ['mcq', 'written'] : body.types
    if (!Array.isArray(types) || types.length === 0 || types.some((type) => !ALLOWED_TYPES.has(type))) {
      throw new Error('Choose at least one supported question type.')
    }
    result.count = count
    result.types = [...new Set(types)]
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
      if (distractors.length < 3) type = safeTypes.find((candidate) => candidate !== 'mcq') || 'written'
      else options = [term, ...distractors].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    }

    const prompt = type === 'written'
      ? `Explain this point in your own words: “${sentence}”`
      : `Complete the sentence from your notes: “${masked}”`
    questions.push({
      type,
      prompt,
      ...(type === 'mcq' ? { options } : {}),
      answer: type === 'written' ? sentence : term,
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
