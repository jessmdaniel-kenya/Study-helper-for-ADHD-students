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
| API and AI | FastAPI in `ai_service/`; NVIDIA NIM calls, Supabase auth/quota, and safety classification all run in Python |
| File parsing | pdf.js, mammoth (DOCX) and Tesseract.js (OCR), all running in the browser |

## Run locally

1. Copy `.env.example` to `.env.local`. Set the Supabase URL and anon key, then add `NVIDIA_API_KEY`. Keep the API key server-only and never add a `VITE_` prefix to it.
2. In Supabase, enable anonymous sign-ins and email/password signup with email confirmation. Run `supabase/schema.sql` for a new project. For an existing project, apply `supabase/migrations/02_ai_material_overviews.sql`.
3. Install backend dependencies with `python -m pip install -r requirements.txt`.
4. In one terminal, start the Python API with `python -m uvicorn ai_service.main:app --reload --host 127.0.0.1 --port 8000`.
5. In a second terminal, install frontend dependencies with `npm install`, then start Vite with `npm run dev`. Vite forwards `/api` requests to the Python API.

The Python API uses NVIDIA NIM for summaries, quizzes, and grading. It checks the Supabase session and daily AI allowance before sending requests to NVIDIA. Guest quotas are tied to the anonymous Supabase session and may reset if that session is lost.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Browser | Supabase project (the anon key is public; protect data with RLS) |
| `VITE_API_BASE_URL` | Browser build | Optional separate Python API origin; leave blank for Docker Compose's `/api` proxy or Vite's development proxy |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Python API | Session checks and the daily AI allowance |
| `NVIDIA_API_KEY`, `NVIDIA_MODEL` | Python API | NVIDIA NIM (`AI_API_KEY` and `AI_MODEL` are accepted aliases) |
| `FRONTEND_ORIGINS` | Python API | Comma-separated origins allowed when hosting the browser UI separately |
| `API_PROXY_TARGET` | Vite dev server | Python API origin for the local `/api` proxy; defaults to `http://127.0.0.1:8000` |

### Docker

Set `VITE_SUPABASE_URL` (or `SUPABASE_URL`), `VITE_SUPABASE_ANON_KEY` (or `SUPABASE_ANON_KEY`), and `NVIDIA_API_KEY` in the project `.env` file. Then start both containers with:

```sh
docker compose up --build
```

Open <http://localhost:8080>. Docker Compose builds and runs the Python API and the Nginx frontend, waits for the API health check, and routes frontend `/api` requests to the backend. Material overviews are processed in 20,000-character sections, up to 1,000,000 characters total. The frontend port can be changed with `FRONTEND_PORT`. The NVIDIA key is passed only to the backend container.

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
| `npm run dev` | Start the frontend; `/api` is proxied to FastAPI |
| `npm run build` | Type-check and build the frontend into `dist/` |
| `npm run lint` | Lint the frontend with oxlint |
| `python -m uvicorn ai_service.main:app --reload --port 8000` | Start the Python API for local development |
| `python -m ai_service.prepare_dataset --help` | Show local training-data preparation options |

## Troubleshooting

- **NVIDIA API key errors:** set `NVIDIA_API_KEY` in `.env.local` and restart `npm run dev`.
- **Theme or font changes don't appear:** preferences are stored per browser in `localStorage`; use **Reset** in the Display menu.
