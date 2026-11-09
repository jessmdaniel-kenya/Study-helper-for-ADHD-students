# Study Helper for ADHD Students

## Run locally

1. Copy `.env.example` to `.env.local`. Set the Supabase URL and anon key, generate a service secret with `python -c "import secrets; print(secrets.token_urlsafe(32))"` and set `PYTHON_AI_SERVICE_TOKEN`, then add only the provider API keys you intend to use. Keep all model keys server-only; never add a `VITE_` prefix.
2. Use Python 3.10 or newer and install the service dependencies with `python -m pip install -r requirements-ai.txt`.
3. In one terminal, start the private Python provider service: `python -m uvicorn ai_service.main:app --host 127.0.0.1 --port 8000`.
4. In Supabase, enable anonymous sign-ins and email/password signup with email confirmation. Run `supabase/schema.sql` for a new project. For an existing project, apply `supabase/migrations/02_ai_material_overviews.sql`.
5. In another terminal, install the frontend dependencies with `npm install`, then start the app with `npm run dev`.

The app's authenticated Node endpoint checks the Supabase session and daily AI allowance before forwarding a request to the Python service. The Python service keeps provider keys server-side and supports NVIDIA NIM, OpenAI, Google Gemini, Anthropic, and Ollama. Configure each provider with its key and model in `.env.local`; the model values in `.env.example` are defaults and can be changed to models enabled for your accounts. Ollama must be installed and running at `OLLAMA_BASE_URL` with the selected model available. Guest quotas are tied to the anonymous Supabase session and may reset if that session is lost.

For production, deploy the Python service on a private HTTPS-capable host. Set `PYTHON_AI_SERVICE_URL` and the same strong `PYTHON_AI_SERVICE_TOKEN` on both the app server and Python service; set provider keys only in the Python service environment. Do not expose the Python service or provider keys to the browser. If the Python service URL is unset, the existing Node endpoint continues to use NVIDIA directly, while other providers are unavailable.

## Study content and file handling

- Study questions are generated in batches sized to the document, targeting about one question per 250 words. A study set is capped at 100 questions; the daily AI allowance is 150 questions.
- Material summaries and overviews are generated on demand and saved with the material. Each key point includes a source excerpt, and the daily AI summary allowance is 10.
- PDF, DOCX, TXT, Markdown, and image uploads are parsed in the browser. Scanned PDFs and images use OCR; original uploaded files are stored privately when Supabase storage is configured.

## Training data preparation

The project does not train a model automatically. API keys authorize inference requests; fine-tuning requires a provider that offers it, an eligible base model, and suitable examples. No training examples are included. Prepare a UTF-8 JSONL file with one object per line using `instruction`, optional `input`, and `output` string fields, then convert it to chat-completion JSONL with:

`python -m ai_service.prepare_dataset --input path\to\examples.jsonl --output path\to\prepared.jsonl`

Review and anonymize data before using it for fine-tuning. Fine-tuning data formats and model eligibility vary by provider, so this generic chat JSONL may need another conversion step. The script only validates and converts local files; it does not upload data or start training.

Run backend tests with `node --test tests/quiz-core.test.js`. Run Python service tests with `python -m unittest discover -s tests\python`. Run the production type-check/build with `npm run build`.
