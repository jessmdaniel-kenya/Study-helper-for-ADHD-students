# FlowState

FlowState is a study app that turns a student's own notes into short, low-pressure study sessions. It supports guest accounts, saved study materials, AI generated questions and summaries, accessibility preferences, and check-in games.

The browser app is built with React, TypeScript, and Vite. The API is Python/FastAPI. Supabase provides authentication, database, and private file storage. NVIDIA NIM is the only remote AI inference provider. File text extraction and OCR run in the browser.

## Run the app on your computer

### 1. Install the prerequisites

- **Git**, to clone the repository.
- **Docker Desktop** with Docker Compose, for the shortest setup; or install **Node.js 22+** and **Python 3.12+** to run the frontend and backend separately.
- A **Supabase project** for account sign-in, cloud saving, and AI access.
- An **NVIDIA API key** for AI generated questions, grading, and summaries.

You can launch the UI without Supabase, but cloud sync and AI features need Supabase configured. AI features also need the NVIDIA key.

### 2. Clone the repository

Open PowerShell, Terminal, or Git Bash and run:

```sh
git clone https://github.com/jessmdaniel-kenya/Study-helper-for-ADHD-students.git
cd Study-helper-for-ADHD-students
```

To work on a particular branch instead of the repository's default branch, list available branches and check one out:

```sh
git branch --all
git switch <branch-name>
```

### 3. Configure Supabase and NVIDIA

1. In Supabase Authentication settings, enable **Anonymous sign-ins** and **Email/password** sign-in.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) once for a new project. For an existing database, read the migration guidance in [the Supabase guide](docs/SUPABASE.md) before applying any migration.
3. Copy the example environment file. For Docker, create `.env`; for separate local frontend and backend processes, create `.env.local`:

   **PowerShell, Docker:**

   ```powershell
   Copy-Item .env.example .env
   ```

   **PowerShell, local development:**

   ```powershell
   Copy-Item .env.example .env.local
   ```

   On macOS/Linux or Git Bash, use `cp .env.example .env` or `cp .env.example .env.local`.

4. Edit the copied file and set the following values:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   NVIDIA_API_KEY=your-nvidia-api-key
   ```

   Find the Supabase URL and anon/public key in your Supabase project's API settings. Get `NVIDIA_API_KEY` from your NVIDIA NIM account. The example file already sets the default NVIDIA model and local ports; `NVIDIA_MODEL` can be changed to another model enabled for your NVIDIA account.

   The Supabase anon key is used by the browser and is expected to be public; database access must be protected by the SQL row-level security policies. The NVIDIA key is secret: keep it only in `.env` or `.env.local`, never add a `VITE_` prefix, and never commit it.

### 4. Start both services

#### Option A: Docker Compose

With Docker Desktop running and `.env` configured, run this from the repository root:

```sh
docker compose up --build
```

Docker builds and starts the Python API and the Nginx frontend. Compose waits for the API health check before starting the frontend. Open <http://localhost:8080>. If port 8080 is already in use, change `FRONTEND_PORT` in `.env` and repeat the command. Stop the running app with Ctrl+C; use `docker compose down` to remove the containers and network.

#### Option B: Run frontend and backend directly

Use two terminals from the repository root. First, install Python dependencies and start the API:

```sh
python -m pip install -r requirements.txt
python -m uvicorn ai_service.main:app --reload --host 127.0.0.1 --port 8000
```

In the second terminal, install JavaScript dependencies and start the frontend:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually <http://localhost:5173>). Vite proxies `/api` requests to the Python service at `http://127.0.0.1:8000`. The backend health endpoint is <http://127.0.0.1:8000/health>.

## First use

Open the app and choose **Continue as guest** to start a study session, or create/sign into an account. Add a PDF, DOCX, TXT, Markdown, or image of notes on the Resources page. The app extracts text in the browser; scanned PDFs and images use OCR. Study questions, grading, and summaries require a working Supabase session and NVIDIA API key.

## Troubleshooting

- **AI says Supabase settings are missing:** check that the URL and anon key are set in the env file read by the backend, then restart the services.
- **AI says a quota function or material overview migration is missing:** for a new database, make sure `supabase/schema.sql` ran. For an older database, follow [the migration guide](docs/SUPABASE.md).
- **NVIDIA configuration or model error:** check `NVIDIA_API_KEY` and confirm that the configured model is enabled for the NVIDIA account.
- **The browser cannot reach the API:** confirm the backend is running. For Docker, inspect `docker compose ps` and `docker compose logs backend`; for local development, verify port 8000 or set `API_PROXY_TARGET` in `.env.local`.
- **PDF worker fails to load:** open the app through the Vite or Docker web server. Do not open the built `index.html` directly from disk.

## Documentation

See [the documentation index](docs/INDEX.md) for guides to the architecture, study/AI flow, Supabase, and training data preparation.
