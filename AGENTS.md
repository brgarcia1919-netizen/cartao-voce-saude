# AGENTS.md

## Cursor Cloud specific instructions

### Overview
This is a **Next.js 16** single-page application (TypeScript, Tailwind CSS v4) for managing health benefits cards ("Cartão Você Saúde"). It uses **Supabase** (hosted) as the backend for auth, database, and RLS — there is no custom backend or API routes.

### Required Environment Variables
The app needs two Supabase secrets injected as environment variables, which are written to `.env.local` on setup:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Running the Dev Server
```
npm run dev       # starts Next.js on http://localhost:3000
```
The root path `/` redirects to `/dashboard`; unauthenticated users are redirected to `/login`.

### Build
```
npm run build
```

### Lint / Tests
- **No ESLint config** is present in the project — there is no lint command.
- **No test framework** (jest, vitest, playwright, etc.) is configured — there are no automated tests.

### Key Caveats
- The project uses `@supabase/supabase-js` directly (singleton in `src/lib/supabase.ts`). Do **not** use `@supabase/ssr` — it causes lock conflicts.
- Auth context relies on `onAuthStateChange()` only; do **not** call `getSession()`.
- All pages are `"use client"` components — no server components for dynamic data.
- The Supabase schema is at `supabase/schema.sql` and seed data at `supabase/seed.sql`. These are run against the hosted Supabase instance, not locally.
- There is no local Supabase setup (`supabase/config.toml` does not exist); the app is designed to connect to a remote Supabase project.
