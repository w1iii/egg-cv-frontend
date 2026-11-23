# Egg CV Frontend

React + Vite + TypeScript operator console for the Egg CV inspection system.

- **Inspect Eggs** (`/inspect`): upload a photo, pick a test image, or capture
  one still frame from a camera. Each image is one inspection; every egg in it
  gets a decision (Acceptable / Reject / Needs Review) with plain-language
  reasons, plus a separate size grade (A / B / C / N/A).
- **Inspection History** (`/history`): every inspection, filterable by egg
  decision and by reason, with a per-egg detail view.
- **Dashboard** (`/`): decision totals and which models and release gates are
  ready, in beta, or disabled.

Decision vocabulary and reason wording live in `src/utils/decisions.ts`; the
backend test `tests/test_contracts.py` checks that `src/types/index.ts` uses
the same decision and grade values as the API.

## Local development

```bash
npm install
npm run dev        # http://localhost:5174
```

`vite.config.ts` proxies `/api` to `http://127.0.0.1:8000` (override with
`VITE_PROXY_TARGET`), so `VITE_API_URL` can stay unset locally.

Quality gates: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Deploy (Vercel)

1. Import this repository; the root directory is the repo itself.
2. Framework preset: **Vite** (also pinned in `vercel.json`).
3. Build command `npm run build`, output directory `dist`.
4. Add the environment variable:

   ```env
   VITE_API_URL=https://your-backend.example.com
   ```

   Use the backend origin only — no `/api/v1` suffix.

SPA routes are rewritten to `index.html` by `vercel.json`.

After the first deploy, add the Vercel URL to the backend's `CORS_ORIGINS`.
