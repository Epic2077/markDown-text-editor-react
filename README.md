# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Knowledge Base

  This Vite React knowledge base uses Supabase Auth and Postgres. Notes are scoped to the signed-in user with Row Level Security; application data is no longer stored in `localStorage`.

  ## Local setup

  1. Create a project at [supabase.com](https://supabase.com/), then open **SQL Editor**.
  2. Run [`supabase/migrations/20261001000000_create_notes.sql`](supabase/migrations/20261001000000_create_notes.sql).
  3. In **Authentication > Providers**, keep Email enabled. Decide whether email confirmation is required.
  4. In **Authentication > URL Configuration**, set the Site URL to `http://localhost:5173` and add `http://localhost:5173` to Redirect URLs. Add the eventual Vercel URL there too.
  5. Copy [`.env.example`](.env.example) to `.env.local` and fill in the project URL and publishable key from **Project Settings > API**. Never put a secret/service-role key in Vite env vars.
  6. Run `npm run dev`.

  The signup flow sends a confirmation email when email confirmation is enabled. The hosted default email service is rate-limited, so configure custom SMTP in Supabase before production use.

  ## Vercel deployment

  1. Push this repository to GitHub and import it into Vercel.
  2. Use framework **Vite**, build command `npm run build`, and output directory `dist`.
  3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel Project Settings > Environment Variables for Preview and Production.
  4. Deploy, then add the production Vercel URL to Supabase Auth **Site URL** and **Redirect URLs**.

  [`vercel.json`](vercel.json) keeps direct visits to `/login`, `/signup`, and note routes working with the client-side router.

  ## Data and security

  The migration enables RLS, revokes `anon` access, and grants signed-in users CRUD access only to rows whose `user_id` matches `auth.uid()`. Keep the publishable key public; the service-role/secret key must stay server-side and is not needed by this client-only app.

```
