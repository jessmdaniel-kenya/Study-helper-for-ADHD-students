import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateQuizRequest,
  makeLocalQuiz,
} from '../api/quiz-core.js'
import quizHandler from '../api/quiz-secure.js'

test('local quiz respects selected types and count without calling a provider', () => {
  const notes = 'Photosynthesis converts light energy into chemical energy in plants. Chlorophyll absorbs light in the leaves. Carbon dioxide and water are used to make glucose and oxygen.'
  const result = makeLocalQuiz(notes, 3, ['flashcard', 'written'])
  assert.ok(result.questions.length > 0)
  assert.ok(result.questions.length <= 3)
  assert.ok(result.questions.every((question) => ['flashcard', 'written'].includes(question.type)))
  assert.equal(result.truncated, false)
})

test('request validation rejects oversized notes, malformed answers, and invalid provider settings', () => {
  assert.throws(
    () => validateQuizRequest({ mode: 'generate', notes: 'x'.repeat(20_001) }),
    /too long/i,
  )
  assert.throws(
    () => validateQuizRequest({ mode: 'grade', notes: 'some notes', question: 'Q', reference: 'R', answer: 'x'.repeat(2_001) }),
    /answer/i,
  )
  assert.throws(
    () => validateQuizRequest({
      mode: 'generate',
      notes: 'some notes',
      provider: { id: 'anthropic', apiKey: 'key', model: 'model' },
    }),
    /DeepSeek or NVIDIA/i,
  )
  assert.throws(
    () => validateQuizRequest({
      mode: 'generate',
      notes: 'some notes',
      provider: { id: 'deepseek', apiKey: '', model: 'deepseek-chat' },
    }),
    /API key/i,
  )
})

test('provider configuration is accepted without requiring a server-side key', () => {
  const input = validateQuizRequest({
    mode: 'generate',
    notes: 'some notes',
    provider: { id: 'nvidia', apiKey: ' user-key ', model: ' model-id ' },
  })
  assert.deepEqual(input.provider, { id: 'nvidia', apiKey: 'user-key', model: 'model-id' })
})

test('DeepSeek and NVIDIA requests use only the supplied user key', async () => {
  const originalFetch = globalThis.fetch
  const quote = 'Photosynthesis converts sunlight into chemical energy in green plants.'
  const providerResponse = {
    questions: [{
      type: 'written',
      prompt: 'What does photosynthesis convert?',
      answer: 'Sunlight into chemical energy.',
      explanation: 'That is the conversion described in the notes.',
      quote,
    }],
  }
  try {
    for (const [id, endpoint, model] of [
      ['deepseek', 'https://api.deepseek.com/chat/completions', 'deepseek-chat'],
      ['nvidia', 'https://integrate.api.nvidia.com/v1/chat/completions', 'meta/llama-3.3-70b-instruct'],
    ]) {
      let request
      globalThis.fetch = async (url, options) => {
        request = { url, options }
        return new Response(JSON.stringify({
          choices: [{ message: { content: JSON.stringify(providerResponse) } }],
        }), { status: 200, headers: { 'content-type': 'application/json' } })
      }

      const response = {
        statusCode: 0,
        body: null,
        status(code) { this.statusCode = code; return this },
        json(body) { this.body = body; return this },
      }
      await quizHandler({
        method: 'POST',
        body: {
          mode: 'generate',
          notes: quote,
          count: 1,
          types: ['written'],
          provider: { id, apiKey: 'user-owned-key', model },
        },
      }, response)

      assert.equal(request.url, endpoint)
      assert.equal(request.options.headers.authorization, 'Bearer user-owned-key')
      assert.equal(JSON.parse(request.options.body).model, model)
      assert.equal(response.statusCode, 200)
      assert.equal(response.body.questions.length, 1)
      assert.equal(JSON.stringify(response.body).includes('user-owned-key'), false)
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})
