import { Decision, DetectionBox, Grade, InspectionMetadata, Prediction } from '../types';

export const DECISIONS: Decision[] = ['Acceptable', 'Reject', 'Needs Review'];

export interface DecisionMeta {
  label: string;
  icon: string;
  badgeClass: string;
  borderClass: string;
  countClass: string;
}

export const DECISION_META: Record<Decision, DecisionMeta> = {
  Acceptable: {
    label: 'Acceptable',
    icon: 'check_circle',
    badgeClass: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    borderClass: 'border-emerald-200',
    countClass: 'text-emerald-700',
  },
  Reject: {
    label: 'Reject',
    icon: 'cancel',
    badgeClass: 'bg-red-50 border-red-300 text-red-800',
    borderClass: 'border-red-200',
    countClass: 'text-red-700',
  },
  'Needs Review': {
    label: 'Needs review',
    icon: 'help',
    badgeClass: 'bg-amber-50 border-amber-300 text-amber-900',
    borderClass: 'border-amber-200',
    countClass: 'text-amber-800',
  },
};

export const LEGACY_META: DecisionMeta = {
  label: 'Not recorded',
  icon: 'history',
  badgeClass: 'bg-slate-50 border-slate-300 text-slate-700',
  borderClass: 'border-slate-200',
  countClass: 'text-slate-600',
};

export function decisionMeta(decision: Decision | null | undefined): DecisionMeta {
  return decision ? DECISION_META[decision] ?? LEGACY_META : LEGACY_META;
}

/** Plain-language explanation for every reason code the backend emits. */
export const REASON_LABELS: Record<string, string> = {
  damaged: 'Shell damage detected',
  stained: 'Shell stain detected',
  detection_low_confidence: 'Low egg-detection confidence',
  partial_visibility: 'Egg is cut off at the image edge',
  overlapping_detection: 'Egg overlaps another egg',
  crop_empty: 'Egg crop was empty',
  crop_invalid: 'Egg crop could not be read',
  crop_too_small: 'Egg is too small in the image to classify',
  crop_underexposed: 'Egg is too dark',
  crop_glare: 'Strong glare on the egg',
  image_low_resolution: 'Image resolution is too low',
  image_blurry: 'Image is blurry',
  damage_needs_review: 'Damage result is uncertain',
  damage_low_confidence: 'Low damage-classifier confidence',
  cleanliness_unapproved: 'Cleanliness model is not release-approved',
  cleanliness_unavailable: 'Cleanliness model unavailable',
  cleanliness_needs_review: 'Cleanliness result is uncertain',
  cleanliness_low_confidence: 'Low cleanliness-classifier confidence',
};

export function splitReasons(text: string | null | undefined): string[] {
  return (text ?? '').split(';').filter(Boolean);
}

export function reasonLabel(code: string): string {
  return REASON_LABELS[code] ?? code.replace(/_/g, ' ');
}

export function gradeLabel(grade: Grade | null | undefined): string {
  switch (grade) {
    case 'A':
      return 'A (Large)';
    case 'B':
      return 'B (Medium)';
    case 'C':
      return 'C (Small)';
    default:
      return 'N/A';
  }
}

export function metadataOf(prediction: Prediction | null | undefined): InspectionMetadata {
  return (prediction?.inference_metadata ?? {}) as InspectionMetadata;
}

export function isLegacy(prediction: Prediction): boolean {
  return prediction.decision_policy_version == null;
}

export function countDecisions(boxes: DetectionBox[]): Record<Decision, number> {
  return boxes.reduce<Record<Decision, number>>(
    (counts, box) => {
      if (box.decision) counts[box.decision] += 1;
      return counts;
    },
    { Acceptable: 0, Reject: 0, 'Needs Review': 0 },
  );
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value * 100)}%`;
}

export function formatMetric(
  value: string | number | null | undefined,
  suffix = '',
  fallback = '—',
): string {
  if (value === null || value === undefined || value === '') return fallback;
  return `${value}${suffix}`;
}

export function shortCode(code: string | null | undefined): string {
  return (code ?? '').slice(0, 8).toUpperCase();
}
