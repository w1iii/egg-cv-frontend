# Decisions, grades and reasons shown to operators

The backend decides; the frontend explains. Wording lives in
`src/utils/decisions.ts`. The policy itself is defined in the backend
(`app/services/grading_service.py`).

## Two separate results per egg

| Field | Values | Meaning |
|---|---|---|
| `decision` | Acceptable, Reject, Needs Review | External quality: damage, cleanliness and whether the input could be trusted. |
| `grade` | A, B, C, N/A | Commercial size grade (Large, Medium, Small). Only for Acceptable eggs with a valid ArUco marker **and** approved size grades; otherwise N/A. |

`Reject` is never a grade. Inspections recorded before decisions existed have
`decision = null` and are labelled **Not recorded** / **Legacy**.

## Release gates the UI surfaces

| Gate | Current setting | What the operator sees |
|---|---|---|
| Cleanliness model approved | off | "Cleanliness model is in beta" notice; cleanliness values tagged *beta*; undamaged eggs show **Needs review: Cleanliness model is not release-approved**. No egg can be Acceptable. |
| Size grades approved | off | Every grade is N/A. With a valid marker, sizes are labelled as unvalidated estimates. |
| Weight estimation | off | Shown as Disabled on the dashboard. |

## Reason codes

| Code | Shown as | Source |
|---|---|---|
| `damaged` | Shell damage detected | Damage classifier |
| `stained` | Shell stain detected | Cleanliness classifier (approved only) |
| `detection_low_confidence` | Low egg-detection confidence | Detector |
| `partial_visibility` | Egg is cut off at the image edge | Crop check |
| `overlapping_detection` | Egg overlaps another egg | Crop check |
| `crop_empty` | Egg crop was empty | Crop check |
| `crop_invalid` | Egg crop could not be read | Crop check |
| `crop_too_small` | Egg is too small in the image to classify | Crop check |
| `crop_underexposed` | Egg is too dark | Crop check |
| `crop_glare` | Strong glare on the egg | Crop check |
| `image_low_resolution` | Image resolution is too low | Image check (applies to all eggs) |
| `image_blurry` | Image is blurry | Image check (applies to all eggs) |
| `damage_needs_review` | Damage result is uncertain | Damage classifier |
| `damage_low_confidence` | Low damage-classifier confidence | Damage classifier |
| `cleanliness_unapproved` | Cleanliness model is not release-approved | Release gate |
| `cleanliness_unavailable` | Cleanliness model unavailable | Model registry |
| `cleanliness_needs_review` | Cleanliness result is uncertain | Cleanliness classifier |
| `cleanliness_low_confidence` | Low cleanliness-classifier confidence | Cleanliness classifier |

An unknown code is shown with underscores replaced by spaces. When the backend
adds a code, add its wording here and in `REASON_LABELS`; the history page's
reason filter lists exactly the codes in `REASON_LABELS`.

The crop and image checks are heuristics that only send eggs to review; their
thresholds have not been tuned on labeled data.
