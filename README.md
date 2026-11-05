# Egg CV Frontend

React + Vite + TypeScript operator console for the Egg CV grading system.

## Local development

```bash
npm install
npm run dev        # http://localhost:5174
```

`vite.config.ts` proxies `/api` and `/uploads` to `http://127.0.0.1:8000`,
so `VITE_API_URL` can stay unset locally.

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
