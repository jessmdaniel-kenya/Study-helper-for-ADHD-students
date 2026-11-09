# Development and deployment

## Requirements

- Node.js 22 or a compatible current LTS release, with npm.
- Python 3.12 for the backend.
- A Supabase project for authentication and cloud data.
- An NVIDIA API key for AI generation, grading, and summaries.

## Environment configuration

Copy `.env.example` to `.env.local` for local development, or to `.env` for Docker Compose. Fill in the Supabase project URL and anon key and the server-side `NVIDIA_API_KEY`.

| Variable | Read by | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Frontend build | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Frontend build | Public Supabase anon key; database access still depends on RLS. |
| `VITE_API_BASE_URL` | Frontend build | Optional API origin. Keep blank when using the local proxy or Compose proxy. |
| `SUPABASE_URL` | Backend | Supabase URL used to validate sessions and consume AI quota. Falls back to `VITE_SUPABASE_URL`. |
| `SUPABASE_ANON_KEY` | Backend | Supabase anon key used by the backend. Falls back to `VITE_SUPABASE_ANON_KEY`. |
| `NVIDIA_API_KEY` | Backend | NVIDIA NIM credential. Never expose it to the browser or prefix it with `VITE_`. |
| `NVIDIA_MODEL` | Backend | NVIDIA model ID. Defaults to `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`. |
| `FRONTEND_ORIGINS` | Backend | Comma-separated browser origins for a separately hosted frontend. |
| `API_PROXY_TARGET` | Vite dev server | Backend origin for local `/api` proxying; defaults to `http://127.0.0.1:8000`. |
| `FRONTEND_PORT` | Docker Compose | Host port for the frontend; defaults to `8080`. |

The API also accepts `AI_API_KEY` and `AI_MODEL` as server-side aliases. Do not put credentials in source control. `.env` and `.env.local` are ignored by Git.

## Local development

1. Configure `.env.local` as above. Enable anonymous sign-in and email/password sign-in in Supabase. Initialize the database as described in [Supabase setup](SUPABASE.md).
2. Install Python dependencies and start the API:

   ```sh
   python -m pip install -r requirements.txt
   python -m uvicorn ai_service.main:app --reload --host 127.0.0.1 --port 8000
   ```

3. In a second terminal, install frontend dependencies and run Vite:

   ```sh
   npm install
   npm run dev
   ```

   Vite serves the frontend and proxies `/api` calls to `API_PROXY_TARGET`.

The backend health endpoint is `http://127.0.0.1:8000/health`. The browser application uses hash routes such as `/#/home`.

## Docker Compose

Set the variables in `.env` (Compose accepts `SUPABASE_URL`/`SUPABASE_ANON_KEY` or the corresponding `VITE_` names for Supabase). Build and start both services with:

```sh
docker compose up --build
```

Open `http://localhost:8080` by default. The Compose stack builds a Python backend and an Nginx frontend. Nginx proxies `/api` to FastAPI, and Compose waits for the backend health check before starting the frontend. Change the host port with `FRONTEND_PORT`.

The Supabase URL and anon key are included in the browser build because the browser uses Supabase directly. The NVIDIA key is passed only to the backend container. Stop the stack with Ctrl+C, then run `docker compose down` to remove its containers and network.

## Project commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite development server. |
| `npm run build` | Type-check and build the frontend to `dist/`. |
| `npm run lint` | Run oxlint on the frontend. |
| `npm run preview` | Preview the production frontend build. |
| `python -m uvicorn ai_service.main:app --reload --port 8000` | Run the Python API locally. |
| `python -m ai_service.prepare_dataset --help` | Show dataset conversion options. |

## Troubleshooting

- **AI reports missing Supabase settings:** configure the URL and anon key for the backend. AI routes require a valid Supabase session to enforce quotas.
- **AI reports a missing quota function:** apply `supabase/migrations/02_ai_material_overviews.sql` to an existing database.
- **NVIDIA key/model errors:** set `NVIDIA_API_KEY` on the backend and verify `NVIDIA_MODEL` is enabled for the NVIDIA account.
- **Frontend cannot reach the API:** for local Vite, check that FastAPI is running on port 8000 or set `API_PROXY_TARGET`; for Docker, inspect both Compose services and backend health.
- **PDF worker import fails:** use the Docker frontend or the Vite dev server so the bundled `.mjs` worker is served as JavaScript. Avoid opening the built HTML directly from disk.
- **Supabase changes do not show up:** confirm frontend build variables and apply the database migration required for that feature.
