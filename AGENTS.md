# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a Next.js 16 (App Router) web application for managing health benefits cards ("Cartão Você Saúde"). It uses Supabase (cloud-hosted) for authentication and PostgreSQL database. There is no custom backend server — all data access is client-side via Supabase JS SDK.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Next.js Dev Server | `npm run dev` | 3000 | The only service to run locally |

### Key caveats

- **Supabase is cloud-hosted only.** The app requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. There is no local Supabase configuration.
- **No ESLint or test framework** is configured in this project. `npm run build` (which includes TypeScript checking) is the primary way to validate code correctness.
- **No git hooks** or pre-commit checks are configured.
- **All pages are client-rendered** (`"use client"` directive). The app uses the `(app)` route group for authenticated pages and `/login` for the login page.
- **Database schema** is in `supabase/schema.sql` and seed data in `supabase/seed.sql` — these are applied via the Supabase SQL Editor, not locally.

### Standard commands

See `package.json` scripts: `npm run dev`, `npm run build`, `npm run start`.
