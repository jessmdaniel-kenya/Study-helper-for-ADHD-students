# Supabase setup and data

FlowState uses Supabase Auth for user sessions, Postgres for saved study materials and AI usage counters, and a private Storage bucket for uploaded originals. Configure Auth, run the SQL, then configure frontend and backend environment variables in [Development and deployment](DEVELOPMENT.md).

## Authentication

Enable anonymous sign-ins and email/password sign-up in the Supabase Auth settings. The landing page waits to create an anonymous session until the user chooses guest mode; direct access to app routes may also start one. Signing up can upgrade the existing anonymous session so its materials remain associated with that user.

AI requests include the current access token. The FastAPI service validates the token using Supabase Auth before consuming quota or calling NVIDIA. If Supabase is not configured, local material persistence can still be used, but provider-backed AI requests cannot run.

## Initialize or migrate the database

For a new Supabase project, enable anonymous auth first, then run `supabase/schema.sql` in the SQL editor. It creates the material, question, completion/reward, usage tables, policies, search function, quota function, and private storage bucket.

For an existing database, review and apply migrations in numeric order when their changes are not already present:

1. `supabase/migrations/01_schema_mega_search_rewards.sql` is for older schemas that do not yet have the material search vector/index and completion reward function. Do not run it if those objects already exist; this migration does not use `if not exists` for all objects.
2. `supabase/migrations/02_ai_material_overviews.sql` adds material overview storage and the server-enforced daily AI quota function/table.

Migration files should be reviewed against the current database before applying; SQL migrations are not automatically run by the app or Docker Compose. `schema.sql` is the current consolidated setup, so it overlaps some migration changes when used to initialize a new database.

## Data model

| Table or resource | Purpose |
| --- | --- |
| `materials` | Owner, title, extracted `full_text`, optional `overview` JSON, timestamps, and generated full-text search vector. |
| `questions` | Optional persisted study questions linked to a material. |
| `completions`, `rewards`, `user_rewards` | Database-side completion and reward records. |
| `ai_usage_daily` | Per-user UTC daily counts for questions, grades, and summaries. |
| `study-materials` storage bucket | Private uploaded source files, stored under a path beginning with the owner's user ID. |

Row-level security policies limit material and question rows to their owners. Storage policies limit files to the authenticated user's folder. The browser uses the public anon key, so these database/storage policies are essential; never use a service-role key in the frontend.

## Quotas

`consume_ai_usage` is a security-definer RPC called by the backend with the user's bearer token. It tracks UTC daily units and enforces 150 generated question units, 200 grading units, and 10 summary units. It accepts at most 100 units per individual RPC call; the client requests question batches of at most 12.

## Local-only records

Mood check-ins, game completion history, Workbench rewards, and display preferences are kept in browser local storage. They are not Supabase records and do not sync between devices. Material text can also use a local-storage fallback when Supabase is not configured.
