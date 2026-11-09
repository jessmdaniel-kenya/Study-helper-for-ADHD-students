import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_NOTES_CHARS,
  MAX_QUESTIONS_PER_BATCH,
  MAX_SUMMARY_CHARS,
  validateQuizRequest,
  makeLocalQuiz,
} from '../api/quiz-core.js'
import quizHandler from '../api/quiz-secure.js'

const notes = 'Photosynthesis converts sunlight into chemical energy in green plants. Chlorophyll absorbs light in the leaves.'

function responseMock() {
  return {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

test('local quiz respects selected types and count without calling a provider', () => {
  const result = makeLocalQuiz(notes, 3, ['flashcard', 'written'])
  assert.ok(result.questions.length > 0)
  assert.ok(result.questions.length <= 3)
  assert.ok(result.questions.every((question) => ['flashcard', 'written'].includes(question.type)))
  const flashcard = result.questions.find((question) => question.type === 'flashcard')
  assert.equal(flashcard?.answer, flashcard?.explanation)
  assert.equal(result.truncated, false)
})

test('request validation bounds each generation batch and supports longer summary inputs', () => {
  assert.throws(
    () => validateQuizRequest({ mode: 'generate', notes, count: MAX_QUESTIONS_PER_BATCH + 1 }),
    /per batch/i,
  )
  assert.throws(
    () => validateQuizRequest({ mode: 'generate', notes: 'x'.repeat(MAX_NOTES_CHARS + 1) }),
    /too long/i,
  )
  assert.equal(
    validateQuizRequest({ mode: 'summarize', notes: 'x'.repeat(MAX_SUMMARY_CHARS), provider: { id: 'nvidia' } }).notes.length,
    MAX_SUMMARY_CHARS,
  )
  assert.throws(
    () => validateQuizRequest({ mode: 'summarize', notes: 'x'.repeat(MAX_SUMMARY_CHARS + 1), provider: { id: 'nvidia' } }),
    /too long/i,
  )
})

test('client cannot send an NVIDIA key or override the server model', () => {
  assert.throws(
    () => validateQuizRequest({
      mode: 'generate',
      notes,
      provider: { id: 'nvidia', apiKey: 'client-key' },
    }),
    /configured on the server/i,
  )
  assert.throws(
    () => validateQuizRequest({
      mode: 'summarize',
      notes,
      provider: { id: 'deepseek' },
    }),
    /supported AI provider/i,
  )
})

test('configured Python service receives model requests after auth and quota checks', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    serviceUrl: process.env.PYTHON_AI_SERVICE_URL,
    serviceToken: process.env.PYTHON_AI_SERVICE_TOKEN,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.PYTHON_AI_SERVICE_URL = 'https://ai-service.test/'
  process.env.PYTHON_AI_SERVICE_TOKEN = 'service-only-token'

  let serviceRequest
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/v1/user')) return jsonResponse({ id: 'guest-id', is_anonymous: true })
    if (url.endsWith('/rest/v1/rpc/consume_ai_usage')) return jsonResponse(true)
    serviceRequest = { url, options }
    return jsonResponse({
      content: JSON.stringify({
        questions: [{
          type: 'written',
          prompt: 'What does photosynthesis convert?',
          answer: 'Sunlight into chemical energy.',
          explanation: 'That is the process described in the material.',
          quote: 'Photosynthesis converts sunlight into chemical energy in green plants.',
        }],
      }),
    })

  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer test-token' },
      body: { mode: 'generate', notes, count: 1, types: ['written'], provider: { id: 'openai' } },
    }, res)

    assert.equal(serviceRequest.url, 'https://ai-service.test/v1/completions')
    assert.equal(serviceRequest.options.headers.authorization, 'Bearer service-only-token')
    assert.equal(JSON.parse(serviceRequest.options.body).provider, 'openai')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.questions.length, 1)
  } finally {
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries({
      SUPABASE_URL: previous.supabaseUrl,
      SUPABASE_ANON_KEY: previous.supabaseAnonKey,
      PYTHON_AI_SERVICE_URL: previous.serviceUrl,
      PYTHON_AI_SERVICE_TOKEN: previous.serviceToken,
    })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('external Python services must use HTTPS before any AI quota is consumed', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    serviceUrl: process.env.PYTHON_AI_SERVICE_URL,
    serviceToken: process.env.PYTHON_AI_SERVICE_TOKEN,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.PYTHON_AI_SERVICE_URL = 'http://remote-ai.test'
  process.env.PYTHON_AI_SERVICE_TOKEN = 'service-only-token'
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/v1/user')) return jsonResponse({ id: 'guest-id', is_anonymous: true })
    throw new Error('Quota must not be used when the configured remote service is insecure.')
  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer test-token' },
      body: { mode: 'generate', notes, count: 1, provider: { id: 'openai' } },
    }, res)
    assert.equal(res.statusCode, 503)
    assert.match(res.body.error, /HTTPS/)
  } finally {
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries({
      SUPABASE_URL: previous.supabaseUrl,
      SUPABASE_ANON_KEY: previous.supabaseAnonKey,
      PYTHON_AI_SERVICE_URL: previous.serviceUrl,
      PYTHON_AI_SERVICE_TOKEN: previous.serviceToken,
    })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('NVIDIA requests authenticate the user and use only the server-side key and model', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.NVIDIA_API_KEY = 'server-only-key'

  let providerRequest
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/v1/user')) return jsonResponse({ id: 'student-id', email_confirmed_at: '2026-01-01T00:00:00Z' })
    if (url.endsWith('/rest/v1/rpc/consume_ai_usage')) {
      assert.deepEqual(JSON.parse(options.body), { p_kind: 'questions', p_units: 1 })
      return jsonResponse(true)
    }
    providerRequest = { url, options }
    return jsonResponse({
      choices: [{
        message: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              questions: [{
                type: 'written',
                prompt: 'What does photosynthesis convert?',
                answer: 'Sunlight into chemical energy.',
                explanation: 'That is the process described in the material.',
                quote: 'Photosynthesis converts sunlight into chemical energy in green plants.',
              }],
            }),
          }],
        },
      }],
    })
  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer student-session-token' },
      body: { mode: 'generate', notes, count: 1, types: ['written'], provider: { id: 'nvidia' } },
    }, res)

    assert.equal(providerRequest.url, 'https://integrate.api.nvidia.com/v1/chat/completions')
    assert.equal(providerRequest.options.headers.authorization, 'Bearer server-only-key')
    assert.equal(JSON.parse(providerRequest.options.body).model, 'meta/llama-3.3-70b-instruct')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.questions.length, 1)
    assert.equal(JSON.stringify(res.body).includes('server-only-key'), false)
  } finally {
    globalThis.fetch = originalFetch
    if (previous.supabaseUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = previous.supabaseUrl
    if (previous.supabaseAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY
    else process.env.SUPABASE_ANON_KEY = previous.supabaseAnonKey
    if (previous.nvidiaApiKey === undefined) delete process.env.NVIDIA_API_KEY
    else process.env.NVIDIA_API_KEY = previous.nvidiaApiKey
  }
})

test('AI environment aliases select the NVIDIA model and explain provider errors', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
    aiApiKey: process.env.AI_API_KEY,
    nvidiaModel: process.env.NVIDIA_MODEL,
    aiModel: process.env.AI_MODEL,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  delete process.env.NVIDIA_API_KEY
  delete process.env.NVIDIA_MODEL
  process.env.AI_API_KEY = 'alias-server-key'
  process.env.AI_MODEL = 'account-model'

  let providerRequest
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/v1/user')) return jsonResponse({ id: 'student-id' })
    if (url.endsWith('/rest/v1/rpc/consume_ai_usage')) return jsonResponse(true)
    providerRequest = { url, options }
    return jsonResponse({}, 404)
  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer test-token' },
      body: { mode: 'generate', notes, count: 12, provider: { id: 'nvidia' } },
    }, res)

    assert.ok(providerRequest, JSON.stringify(res.body))
    assert.equal(JSON.parse(providerRequest.options.body).model, 'account-model')
    assert.equal(JSON.parse(providerRequest.options.body).max_tokens, 8_192)
    assert.equal(res.statusCode, 502)
    assert.match(res.body.error, /HTTP 404.*NVIDIA_MODEL\/AI_MODEL/i)
  } finally {
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries({
      SUPABASE_URL: previous.supabaseUrl,
      SUPABASE_ANON_KEY: previous.supabaseAnonKey,
      NVIDIA_API_KEY: previous.nvidiaApiKey,
      AI_API_KEY: previous.aiApiKey,
      NVIDIA_MODEL: previous.nvidiaModel,
      AI_MODEL: previous.aiModel,
    })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('empty NVIDIA completions report their finish reason without exposing provider data', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.NVIDIA_API_KEY = 'server-only-key'
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/v1/user')) return jsonResponse({ id: 'student-id' })
    if (url.endsWith('/rest/v1/rpc/consume_ai_usage')) return jsonResponse(true)
    return jsonResponse({ choices: [{ message: { content: '' }, finish_reason: 'length' }] })
  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer test-token' },
      body: { mode: 'generate', notes, count: 1, provider: { id: 'nvidia' } },
    }, res)

    assert.equal(res.statusCode, 502)
    assert.match(res.body.error, /no text/i)
    assert.match(res.body.error, /output limit/i)
    assert.equal(JSON.stringify(res.body).includes('server-only-key'), false)
  } finally {
    globalThis.fetch = originalFetch
    if (previous.supabaseUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = previous.supabaseUrl
    if (previous.supabaseAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY
    else process.env.SUPABASE_ANON_KEY = previous.supabaseAnonKey
    if (previous.nvidiaApiKey === undefined) delete process.env.NVIDIA_API_KEY
    else process.env.NVIDIA_API_KEY = previous.nvidiaApiKey
  }
})

test('NVIDIA provider timeouts return a retryable gateway timeout', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.NVIDIA_API_KEY = 'server-only-key'
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/v1/user')) return jsonResponse({ id: 'student-id' })
    if (url.endsWith('/rest/v1/rpc/consume_ai_usage')) return jsonResponse(true)
    throw new DOMException('The operation timed out.', 'TimeoutError')
  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer test-token' },
      body: { mode: 'generate', notes, count: 1, provider: { id: 'nvidia' } },
    }, res)

    assert.equal(res.statusCode, 504)
    assert.match(res.body.error, /55 seconds/)
    assert.match(res.body.error, /shorter section/)
  } finally {
    globalThis.fetch = originalFetch
    if (previous.supabaseUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = previous.supabaseUrl
    if (previous.supabaseAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY
    else process.env.SUPABASE_ANON_KEY = previous.supabaseAnonKey
    if (previous.nvidiaApiKey === undefined) delete process.env.NVIDIA_API_KEY
    else process.env.NVIDIA_API_KEY = previous.nvidiaApiKey
  }
})

test('summarization returns a bounded overview and consumes the summary allowance', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.NVIDIA_API_KEY = 'server-only-key'

  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/v1/user')) return jsonResponse({ id: 'student-id', email_confirmed_at: '2026-01-01T00:00:00Z' })
    if (url.endsWith('/rest/v1/rpc/consume_ai_usage')) {
      assert.deepEqual(JSON.parse(options.body), { p_kind: 'summaries', p_units: 1 })
      return jsonResponse(true)
    }
    return jsonResponse({
      choices: [{
        message: {
          content: JSON.stringify({
            overview: 'A short overview.',
            summary: 'Photosynthesis stores light energy as chemical energy.',
            keyPoints: [
              {
                point: 'Chlorophyll absorbs light.',
                quote: 'Chlorophyll absorbs light in the leaves.',
              },
              {
                point: 'An unsupported claim.',
                quote: 'This claim is not in the study material.',
              },
            ],
            keyTerms: [{ term: 'Chlorophyll', definition: 'A pigment in leaves.' }],
            studyPlan: ['Review the process.'],
          }),
        },
      }],
    })
  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer student-session-token' },
      body: { mode: 'summarize', notes, provider: { id: 'nvidia' } },
    }, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.overview, 'A short overview.')
    assert.equal(res.body.keyPoints.length, 1)
    assert.equal(res.body.keyPoints[0].point, 'Chlorophyll absorbs light.')
    assert.deepEqual(res.body.keyTerms, [{ term: 'Chlorophyll', definition: 'A pigment in leaves.' }])
  } finally {
    globalThis.fetch = originalFetch
    if (previous.supabaseUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = previous.supabaseUrl
    if (previous.supabaseAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY
    else process.env.SUPABASE_ANON_KEY = previous.supabaseAnonKey
    if (previous.nvidiaApiKey === undefined) delete process.env.NVIDIA_API_KEY
    else process.env.NVIDIA_API_KEY = previous.nvidiaApiKey
  }
})

test('AI requests reject unauthenticated callers before consuming quota', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.NVIDIA_API_KEY = 'server-only-key'
  globalThis.fetch = async (url) => {
    assert.ok(url.endsWith('/auth/v1/user'))
    return jsonResponse({ error: 'invalid token' }, 401)
  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer invalid-token' },
      body: { mode: 'summarize', notes, provider: { id: 'nvidia' } },
    }, res)
    assert.equal(res.statusCode, 401)
  } finally {
    globalThis.fetch = originalFetch
    if (previous.supabaseUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = previous.supabaseUrl
    if (previous.supabaseAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY
    else process.env.SUPABASE_ANON_KEY = previous.supabaseAnonKey
    if (previous.nvidiaApiKey === undefined) delete process.env.NVIDIA_API_KEY
    else process.env.NVIDIA_API_KEY = previous.nvidiaApiKey
  }
})

test('anonymous sessions can use shared NVIDIA AI within their quota', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.NVIDIA_API_KEY = 'server-only-key'
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/v1/user')) return jsonResponse({ id: 'guest-id', is_anonymous: true })
    if (url.endsWith('/rest/v1/rpc/consume_ai_usage')) return jsonResponse(true)
    if (url === 'https://integrate.api.nvidia.com/v1/chat/completions') {
      return jsonResponse({
        choices: [{
          message: {
            content: JSON.stringify({
              overview: 'A short overview.',
              summary: 'A short study summary.',
              keyPoints: [{ point: 'Chlorophyll absorbs light.', quote: 'Chlorophyll absorbs light in the leaves.' }],
              keyTerms: [{ term: 'Chlorophyll', definition: 'A pigment in leaves.' }],
              studyPlan: ['Review the process.'],
            }),
          },
        }],
      })
    }
    assert.fail(`Unexpected request: ${url}`)
  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer guest-session-token' },
      body: { mode: 'summarize', notes, provider: { id: 'nvidia' } },
    }, res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.overview, 'A short overview.')
  } finally {
    globalThis.fetch = originalFetch
    if (previous.supabaseUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = previous.supabaseUrl
    if (previous.supabaseAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY
    else process.env.SUPABASE_ANON_KEY = previous.supabaseAnonKey
    if (previous.nvidiaApiKey === undefined) delete process.env.NVIDIA_API_KEY
    else process.env.NVIDIA_API_KEY = previous.nvidiaApiKey
  }
})

test('daily AI quota denial is surfaced without calling NVIDIA', async () => {
  const originalFetch = globalThis.fetch
  const previous = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  }
  process.env.SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.NVIDIA_API_KEY = 'server-only-key'
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/v1/user')) return jsonResponse({ id: 'student-id', email_confirmed_at: '2026-01-01T00:00:00Z' })
    if (url.endsWith('/rest/v1/rpc/consume_ai_usage')) return jsonResponse(false)
    assert.fail('NVIDIA should not be called when the quota is denied.')
  }

  try {
    const res = responseMock()
    await quizHandler({
      method: 'POST',
      headers: { authorization: 'Bearer student-session-token' },
      body: { mode: 'summarize', notes, provider: { id: 'nvidia' } },
    }, res)
    assert.equal(res.statusCode, 429)
    assert.match(res.body.error, /allowance/i)
  } finally {
    globalThis.fetch = originalFetch
    if (previous.supabaseUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = previous.supabaseUrl
    if (previous.supabaseAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY
    else process.env.SUPABASE_ANON_KEY = previous.supabaseAnonKey
    if (previous.nvidiaApiKey === undefined) delete process.env.NVIDIA_API_KEY
    else process.env.NVIDIA_API_KEY = previous.nvidiaApiKey
  }
})
