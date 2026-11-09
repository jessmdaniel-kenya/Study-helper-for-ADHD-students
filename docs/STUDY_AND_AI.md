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
- **Energy adaptation:** Low energy selects flashcards and multiple choice by default, reduces the planned question count, and asks for short, straightforward prompts. Medium uses the normal mix and count. Wired increases the planned count and asks for more application and reasoning. Students can change the suggested question formats before starting.
- **Grading:** the browser sends the question, expected answer, student answer, and the question's source quote. It does not send the entire document for grading.
- **Material overview:** the browser sends the material text once. The backend accepts up to 1,000,000 characters and processes it sequentially in chunks of up to 20,000 characters. Each chunk gets a one-sentence overview and concise, topic-led study notes that explain core ideas and preserve supported definitions, steps, cause-and-effect, comparisons, formulas, and qualifications. The notes use a short topic heading, paragraph, and key-detail bullets; the backend combines them and validates quoted key points against the original source.
- **Safety classifier:** a local Python rules-based classifier checks new community-feed drafts of up to 2,000 characters before they are shown in the feed. Flagged drafts remain editable and are not posted; if the check cannot run, the draft is kept and posting is stopped. This endpoint does not call an external AI provider.

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

For generation requests, `energyLevel` may be `Low`, `Medium`, or `Wired`; it defaults to `Medium`. The browser uses the selected level to adjust the overall study-set size and the prompt uses it to tune question challenge and wording.

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

The notes limit is 1,000,000 characters. The response contains `overview`, `summary`, `summaryBlocks` (safe text blocks for headings, paragraphs, and lists), `keyPoints`, `keyTerms`, and `studyPlan`.

### `POST /api/safety-classifier`

Accepts `{ "text": "..." }`; the text must be non-empty and at most 2,000 characters. Returns the local classifier result and any short evidence excerpts. The community composer calls this endpoint before adding a post to its feed.

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

NVIDIA responses are expected to contain JSON. The backend accepts fenced or surrounding-prose JSON and retries once when it cannot parse a complete response. Generated question quotes and summary key-point quotes are checked against supplied notes. Summary prompts prioritize clear explanations over sentence-by-sentence paraphrase, prohibit unsupported additions, and request a compact Markdown structure. Source text is treated as untrusted input.
