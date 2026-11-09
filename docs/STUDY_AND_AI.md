# Study materials and AI API

## File extraction

Text extraction runs in the browser in `src/lib/extractor.ts`; there is no separate extraction worker service.

| Format | Implementation |
| --- | --- |
| PDF | pdf.js reads embedded text. Pages with very little text are rendered and passed through Tesseract.js OCR. |
| DOCX | Mammoth extracts raw text in the browser. |
| TXT and Markdown | Browser `File.text()`. |
| PNG, JPG/JPEG, WEBP | Tesseract.js OCR. |

Files must be no larger than 25 MB. Extracted text must contain at least 50 non-whitespace characters to be accepted. Older `.doc` files need conversion to `.docx`. Extraction is limited to English OCR in the current implementation.

## How study operations work

- **Question generation:** the browser estimates one question per 250 words, with at least 3 and at most 100 questions per study set. It splits notes into requests no larger than 18,000 characters or 2,500 words and sends up to 12 requested questions per API request. Failed later batches can leave a partial set with a warning.
- **Grading:** the browser sends the question, expected answer, student answer, and the question's source quote. It does not send the entire document for grading.
- **Material overview:** the browser sends the material text once. The backend accepts up to 1,000,000 characters and processes it sequentially in sections of up to 20,000 characters. It combines each section's overview and summary, and validates quoted key points against the original source.
- **Safety classifier:** a local Python classifier checks a text of up to 2,000 characters. This endpoint does not call an external AI provider.

NVIDIA NIM is the only remote AI inference provider. The default model is `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`; deployments can set `NVIDIA_MODEL` to a different NVIDIA model. AI configuration lives on the server.

## API endpoints

### `GET /health`

Returns `{"status":"ok"}` when the API process is responding. This is a process health check; it does not verify external Supabase or NVIDIA connectivity.

### `POST /api/quiz`

Send a JSON object with a `mode` and `notes`. AI calls require a bearer token from a Supabase session. For provider-backed calls, use `"provider":{"id":"nvidia"}`; do not send model or API-key settings.

**Generate:**

```json
{
  "mode": "generate",
  "provider": { "id": "nvidia" },
  "notes": "Study text...",
  "count": 6,
  "types": ["mcq", "written", "flashcard"]
}
```

`count` must be from 1 to 12 per request. Supported types are `mcq`, `written`, and `flashcard`. The response contains `questions`, `truncated`, and `mode`. Each returned question includes a source quote; MCQ questions have four options.

**Grade:**

```json
{
  "mode": "grade",
  "provider": { "id": "nvidia" },
  "notes": "A quote from the source",
  "question": "What is being tested?",
  "reference": "Expected answer",
  "answer": "Student answer"
}
```

The three answer fields are limited to 2,000 characters each. The response contains `verdict`, `feedback`, and `best_fit`.

**Summarize:**

```json
{
  "mode": "summarize",
  "provider": { "id": "nvidia" },
  "notes": "Full material text..."
}
```

The notes limit is 1,000,000 characters. The response contains `overview`, `summary`, `keyPoints`, `keyTerms`, and `studyPlan`.

### `POST /api/safety-classifier`

Accepts `{ "text": "..." }`; the text must be non-empty and at most 2,000 characters. Returns the local classifier result and any short evidence excerpts.

### Retired endpoints

`POST /api/ai` and `POST /api/generate-questions` return HTTP 410. Use `/api/quiz` with the appropriate mode.

## Authentication, quotas, and errors

AI routes require a valid Supabase bearer session. The server validates it against Supabase Auth and reserves daily allowance through the `consume_ai_usage` database function before inference:

| Operation | Daily units |
| --- | ---: |
| Generated questions | 150 questions |
| Grading | 200 answers |
| Summaries | 10 summaries |

Common status codes include 400 for invalid input, 401 for a missing/invalid session, 429 for a daily limit or NVIDIA rate limit, 502 for an upstream NVIDIA error or unusable output, 503 for missing configuration or unavailable Supabase, and 504 for an NVIDIA timeout. Error responses use an `error` string.

NVIDIA responses are expected to contain JSON. The backend accepts fenced or surrounding-prose JSON and retries once when it cannot parse a complete response. Generated question quotes and summary key-point quotes are checked against supplied notes. Source text is treated as untrusted input.
