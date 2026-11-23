# Verification record

Branch `feat/inspection-quality-decisions`, 23 November 2026.

## Automated gates

| Gate | Command | Result |
|---|---|---|
| Type check | `npx tsc --noEmit` | passed |
| Lint | `npm run lint` (`--max-warnings 0`) | passed |
| Production build | `npm run build` | passed |
| API vocabulary contract | backend `pytest tests/test_contracts.py` (reads `src/types/index.ts`) | passed |

The frontend has no unit-test runner; behaviour is covered by the backend API
tests and the manual check below.

## Manual check against the real models

Backend on a throwaway SQLite database with the real checkpoints; frontend
through the Vite dev proxy; Node 24.14.0.

| Check | Result |
|---|---|
| Inspect the sample *Seven Cracked and Speckled Eggs* | 7 eggs; 0 Acceptable, 4 Reject, 3 Needs Review, matching the backend output for the same image |
| Notices | Cleanliness-beta and "no valid sizing marker" notices shown |
| Egg cards | Decision badge, plain-language reason, damage/cleanliness with confidence, *beta* tag, grade N/A |
| Annotated image | Loaded through the download endpoint |
| Inspection History | Inspection listed with counts; detail drawer explains every egg; Escape closes it |
| Dashboard | Decision totals; cleanliness shown as "Loaded · not approved"; size grades and weight "Disabled" |
| Browser console | No errors |
| 375 px width | Cards stack; no horizontal scroll |

## Not verified

- Live camera capture on real hardware (no camera used in this check).
- Deployment on Vercel with the new backend.
- Screen-reader walkthrough; only semantics were reviewed.
