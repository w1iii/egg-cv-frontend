# Frontend architecture

React 18 + Vite 5 + TypeScript + Tailwind CSS operator console for the Egg CV
inspection API (`egg-cv-backend`). Current as of branch
`feat/inspection-quality-decisions`.

## Pages and routes

| Route | Page | Purpose |
|---|---|---|
| `/` | `src/pages/DashboardPage.tsx` | Totals, egg decision counts, recent inspections, and readiness of each model and release gate. |
| `/inspect` | `src/pages/Inspector.tsx` | Run one inspection: upload a file, pick a bundled test image, or capture one camera frame. Shows the result for that image. |
| `/history` | `src/pages/InspectionHistoryPage.tsx` | Every inspection, filtered by egg decision and reason (server side), plus a per-egg detail drawer. `?inspection=<id>` opens one directly. |

## Components

| Component | Role |
|---|---|
| `components/Navbar.tsx` | Top navigation (bottom bar on phones). |
| `components/DecisionBadge.tsx` | `DecisionBadge` (icon + text, never colour alone) and `ReasonList` (plain-language reasons). |
| `components/InspectionNotices.tsx` | Everything that limits trust in a result: failed, legacy, beta or missing cleanliness model, calibration state, image-quality problems, annotation or CSV failures. Shared by the inspector and the history drawer. |
| `components/inspector/ImageDropzone.tsx` | Drag-and-drop / click upload, keyboard operable. |
| `components/inspector/SampleImageStrip.tsx` | Test images listed in `public/egg-images/manifest.json`. |
| `components/inspector/LiveCameraCapture.tsx` | Camera preview; **Space** or **Capture** sends one still frame. Nothing is analysed during preview. |
| `components/inspector/ResultsPanel.tsx` | Decision counts (also act as filters), notices, annotated image, egg cards. |
| `components/inspector/EggResultCard.tsx` | One egg: decision, "Rejected because / Review because", damage and cleanliness with confidence (cleanliness tagged *beta* when not approved), size grade, size, length, breadth. |
| `components/inspector/StatusFooter.tsx` | API health and JSON export of the current inspection. |

## Data flow for one inspection

1. The image becomes a `CapturedFrame` (`utils/frames.ts`) so a preview and egg
   crop thumbnails can be drawn locally.
2. `apiClient.inspectImage()` posts it to `POST /api/v1/predictions/upload`.
3. The response (`PredictionDetail`) holds every detected egg with its
   `decision`, `decision_reason`, `grade` and raw classifier output, plus
   `inference_metadata` (thresholds, model hashes, calibration, image quality).
4. The inspector keeps only the latest result in `localStorage`
   (`egg-cv:inspector-state:v2`) for convenience; the backend is the record.

There is no batch: each image is one inspection and nothing accumulates
across images.

## API contract

Types: `src/types/index.ts`. Client: `src/api/client.ts`.

| Client method | Endpoint |
|---|---|
| `inspectImage(file)` | `POST /predictions/upload` |
| `getInspections(skip, limit, { decision, review_reason })` | `GET /predictions` |
| `getInspection(id)` | `GET /predictions/{id}` |
| `deleteInspection(id)` | `DELETE /predictions/{id}` |
| `getDashboardStats()` | `GET /dashboard/stats` |
| `getDecisionDistribution()` | `GET /dashboard/decisions` |
| `getGradeDistribution()` | `GET /dashboard/grades` |
| `getHealth()` | `GET /dashboard/health` |

The annotated image is read through `annotated_url`
(`/api/v1/predictions/{id}/download`); uploaded files are not served
statically. The backend test `tests/test_contracts.py` fails if the
`Decision` or `Grade` unions here drift from the API vocabulary.

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_URL` | build time (Vercel) | Backend origin without `/api/v1`. Unset locally. |
| `VITE_PROXY_TARGET` | `npm run dev` | Backend for the dev proxy (default `http://127.0.0.1:8000`). |

## Accessibility

- Decisions are shown with an icon and words, not colour alone.
- Analysis progress is announced through a polite live region; errors use
  `role="alert"`.
- Filters are labelled; decision filter buttons expose `aria-pressed`.
- The history drawer is a labelled modal dialog and closes with **Escape**.
- Upload works by keyboard (**U** shortcut, Enter/Space on the drop zone);
  camera capture works with **Space**.
- Layout checked at 375 px width with no horizontal scrolling.
