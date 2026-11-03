import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isAnthropicEnabled,
  validateQuizRequest,
  makeLocalQuiz,
} from '../api/quiz-core.js'

test('Anthropic stays disabled unless explicitly enabled with a key', () => {
  assert.equal(isAnthropicEnabled({ AI_API_KEY: 'secret' }), false)
  assert.equal(isAnthropicEnabled({ AI_MODE: 'local', AI_API_KEY: 'secret' }), false)
  assert.equal(isAnthropicEnabled({ AI_MODE: 'anthropic', AI_API_KEY: 'secret' }), true)
  assert.equal(isAnthropicEnabled({ AI_MODE: 'anthropic' }), false)
})

test('local quiz respects selected types and count without calling a provider', () => {
  const notes = 'Photosynthesis converts light energy into chemical energy in plants. Chlorophyll absorbs light in the leaves. Carbon dioxide and water are used to make glucose and oxygen.'
  const result = makeLocalQuiz(notes, 3, ['flashcard', 'written'])
  assert.ok(result.questions.length > 0)
  assert.ok(result.questions.length <= 3)
  assert.ok(result.questions.every((question) => ['flashcard', 'written'].includes(question.type)))
  assert.equal(result.truncated, false)
})

test('request validation rejects excessive notes and malformed answer payloads', () => {
  assert.throws(
    () => validateQuizRequest({ mode: 'generate', notes: 'x'.repeat(20_001) }),
    /too long/i,
  )
  assert.throws(
    () => validateQuizRequest({ mode: 'grade', notes: 'some notes', question: 'Q', reference: 'R', answer: 'x'.repeat(2_001) }),
    /answer/i,
  )
})
