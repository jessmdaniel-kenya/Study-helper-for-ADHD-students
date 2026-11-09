# FlowState: Study Helper for ADHD Students

FlowState turns a student's own notes into short, low-pressure study sessions. Students upload PDFs, Word files, text or photos of their notes. The app generates bite-size questions and summaries with source excerpts, and adapts each session to the student's energy level.

- **Start without an account.** Students can study as a guest in one tap and add an email later to keep their notes across devices.
- **Comfort settings.** Light/dark mode, six colour palettes, seven reading fonts (including OpenDyslexic and Atkinson Hyperlegible), adjustable text size and line spacing, and a low-stimulation mode that turns off motion and bright accents.
- **Check-in games.** One-minute games (mood weather, box breathing, odd one out, memory pairs) help students settle in before studying.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, Vite, TypeScript, React Router (hash routing), Zustand |
| Styling | Tailwind CSS v4 (no Preflight), shadcn/ui, [Kokonut UI](https://kokonutui.com), Motion |
| Auth and data | Supabase: anonymous and email/password auth, Postgres, Storage |
| API | Vercel-style functions in `api/` (Node) |
| AI | Private FastAPI service in `ai_service/` for NVIDIA NIM, OpenAI, Gemini, Anthropic or Ollama |
| File parsing | pdf.js, mammoth (DOCX) and Tesseract.js (OCR), all running in the browser |

## Run locally

1. Copy `.env.example` to `.env.local`. Set the Supabase URL and anon key, then add only the provider API keys you intend to use. Keep all model keys server-only and never add a `VITE_` prefix to them.
2. In Supabase, enable anonymous sign-ins and email/password signup with email confirmation. Run `supabase/schema.sql` for a new project. For an existing project, apply `supabase/migrations/02_ai_material_overviews.sql`.
3. Install the frontend dependencies with `npm install`, then start the app with `npm run dev`.

That is enough to run the app with **NVIDIA only**: set `NVIDIA_API_KEY` and leave `PYTHON_AI_SERVICE_URL` unset. To use OpenAI, Gemini, Anthropic or Ollama, also run the Python service:

4. Generate a service secret with `python -c "import secrets; print(secrets.token_urlsafe(32))"` and set it as `PYTHON_AI_SERVICE_TOKEN`. Set `PYTHON_AI_SERVICE_URL=http://127.0.0.1:8000`, including the `http://`.
5. Use Python 3.10 or newer and install the service dependencies with `python -m pip install -r requirements-ai.txt`.
6. In a second terminal, start the service with `python -m uvicorn ai_service.main:app --host 127.0.0.1 --port 8000`. Restart `npm run dev` after changing `.env.local`, because the server reads it only at startup.

The app's authenticated Node endpoint checks the Supabase session and daily AI allowance before forwarding a request to the Python service. The Python service keeps provider keys server-side and supports NVIDIA NIM, OpenAI, Google Gemini, Anthropic and Ollama. Configure each provider with its key and model in `.env.local`. The model values in `.env.example` are defaults; change them to models enabled for your accounts. Ollama must be installed and running at `OLLAMA_BASE_URL` with the selected model available. Guest quotas are tied to the anonymous Supabase session and may reset if that session is lost.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Browser | Supabase project (the anon key is public; protect data with RLS) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | App server | Session checks and the daily AI allowance |
| `NVIDIA_API_KEY`, `NVIDIA_MODEL` | App server or Python service | NVIDIA NIM (`AI_API_KEY` and `AI_MODEL` are accepted aliases) |
| `PYTHON_AI_SERVICE_URL` | App server | Full URL of the Python service: `http://127.0.0.1:8000` locally, `https://…` in production |
| `PYTHON_AI_SERVICE_TOKEN` | App server **and** Python service | Shared secret between the two |
| `OPENAI_*`, `GEMINI_*`, `ANTHROPIC_*`, `OLLAMA_*` | Python service | Optional providers; see `.env.example` |

### Production

Deploy the Python service on a private HTTPS-capable host. Set `PYTHON_AI_SERVICE_URL` and the same strong `PYTHON_AI_SERVICE_TOKEN` on both the app server and the Python service, and set provider keys only in the Python service environment. Do not expose the Python service or provider keys to the browser. If `PYTHON_AI_SERVICE_URL` is unset, the Node endpoint calls NVIDIA directly and the other providers are unavailable.

## App flow and pages

| Route | Page |
|---|---|
| `/#/` | Landing page with hero, how-it-works steps and features. "Continue as guest" starts an anonymous session. |
| `/#/start` | Sign-in page with Guest, Sign in and Join tabs (`?mode=guest`, `signin` or `signup`). Join upgrades the current guest session, so guest notes carry over to the account. |
| `/#/home` | Dashboard. Guests see a prompt to save their progress. |
| `/#/study`, `/#/resources`, `/#/energy`, `/#/feed` | Study sessions, uploaded materials, energy check-in and community |
| `/#/game` | Check-in games and the Tinker's Workbench (`?tab=workbench`) |

Visiting the landing page does not create a session. A guest session starts only when the student chooses "Continue as guest" or opens an in-app page directly.

## Display and accessibility settings

The **Display** menu in the top bar and the sun/moon toggle control every display preference. The landing and sign-in pages have the same toggle and a low-stimulation switch. All preferences are stored in `src/lib/preferences.ts`, saved in `localStorage` and applied before the first paint.

- **Theme:** Light, Dark or System, plus six colour palettes. Tailwind's `dark:` variant follows the `.dark` class on `<html>`.
- **Reading font:** Inter, Atkinson Hyperlegible, Lexend, OpenDyslexic, Literata, Comic Neue or the device font. Fonts are bundled with `@fontsource` and download only when selected.
- **Text size:** S, M, L or XL; scales page content. **Line spacing:** Compact, Normal or Relaxed.
- **Low stimulation:** turns off animations, spotlights, particle bursts and bright accents. The operating system's reduced-motion setting is respected as well.

## Check-in games

These games are on the Games page. History is stored on the device in `src/lib/checkins.ts` and is not synced to the account.

- **Mood weather:** pick an "inner weather" and an energy level. The game suggests a study pace and can open Study at that pace.
- **Box breathing:** three guided 4-4-4-4 breaths.
- **Odd one out:** five rounds of spotting the different icon.
- **Memory pairs:** find four matching pairs.

The games have no timers or penalties. The page shows today's check-ins and a day streak.

## UI components

- shadcn/ui is configured in `components.json`; components live in `src/components/ui/`.
- Kokonut UI is registered as `@kokonutui`; components live in `src/components/kokonutui/`. Add more with `npx shadcn@latest add @kokonutui/<name>`.
- The legacy stylesheet (`src/index.css`) sits in Tailwind's `base` layer, so utility classes override it. Tailwind's Preflight reset is off; pages built with Tailwind wrap their content in `.tw-scope` to reset native button and fieldset styles.

> **Local patches:** `src/components/kokonutui/particle-button.tsx` re-measures its label after web fonts load, and `slide-text-button.tsx` uses React Router instead of `next/link`. Re-adding either file with `--overwrite` removes these changes.

Example: an async button that shows a spinner, then a check mark with a particle burst, or an error shake:

```tsx
import ParticleButton from '@/components/kokonutui/particle-button'

<ParticleButton
  pendingLabel="Saving"
  successLabel="Saved"
  particles={!calm}
  onClick={async () => { await saveNotes() }}
>
  Save notes
</ParticleButton>
```

## Study content and file handling

- Study questions are generated in batches sized to the document, targeting about one question per 250 words. A study set is capped at 100 questions; the daily AI allowance is 150 questions.
- Material summaries and overviews are generated on demand and saved with the material. Each key point includes a source excerpt, and the daily AI summary allowance is 10.
- PDF, DOCX, TXT, Markdown and image uploads are parsed in the browser. Scanned PDFs and images use OCR; original uploaded files are stored privately when Supabase storage is configured.

## Training data preparation

The project does not train a model automatically. API keys authorize inference requests; fine-tuning requires a provider that offers it, an eligible base model and suitable examples. No training examples are included. Prepare a UTF-8 JSONL file with one object per line, using `instruction`, optional `input`, and `output` string fields. Then convert it to chat-completion JSONL with:

`python -m ai_service.prepare_dataset --input path\to\examples.jsonl --output path\to\prepared.jsonl`

Review and anonymize data before using it for fine-tuning. Fine-tuning data formats and model eligibility vary by provider, so this generic chat JSONL may need another conversion step. The script only validates and converts local files; it does not upload data or start training.

## Scripts and tests

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server, including the local `/api/quiz` endpoint |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Lint with oxlint |
| `node --test tests/quiz-core.test.js` | Backend tests |
| `python -m unittest discover -s tests\python` | Python service tests |

## Troubleshooting

- **"PYTHON_AI_SERVICE_URL must be a valid HTTP(S) URL":** the value is missing its scheme. Use `http://127.0.0.1:8000`, not `127.0.0.1:8000`. To use NVIDIA only, remove both `PYTHON_AI_SERVICE_URL` and `PYTHON_AI_SERVICE_TOKEN`. Restart `npm run dev` after editing `.env.local`.
- **"Use HTTPS for PYTHON_AI_SERVICE_URL outside local development":** plain `http://` is allowed only for `localhost`, `127.0.0.1` and `[::1]`.
- **"This provider requires the Python AI service":** start the Python service (step 6) or switch to NVIDIA.
- **Theme or font changes don't appear:** preferences are stored per browser in `localStorage`; use **Reset** in the Display menu.
