import { PredictionDetail } from '../types';
import { isLegacy, metadataOf, reasonLabel } from '../utils/decisions';

type Tone = 'info' | 'warn' | 'error';

const TONES: Record<Tone, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-950',
  warn: 'border-amber-300 bg-amber-50 text-amber-950',
  error: 'border-red-200 bg-red-50 text-red-900',
};

function Notice({
  tone,
  icon,
  compact,
  children,
}: {
  tone: Tone;
  icon: string;
  compact: boolean;
  children: React.ReactNode;
}) {
  const size = compact ? 'gap-1.5 rounded-lg px-2.5 py-1.5 text-xs leading-snug' : 'gap-2 rounded-xl px-3 py-2 text-sm';
  return (
    <li className={`flex items-start border ${size} ${TONES[tone]}`}>
      <span aria-hidden="true" className={`material-symbols-outlined mt-px ${compact ? 'text-[15px]' : 'text-[18px]'}`}>{icon}</span>
      <span>{children}</span>
    </li>
  );
}

/** Everything a reviewer must know about how far an inspection can be trusted. */
export function InspectionNotices({ result, compact = false }: { result: PredictionDetail; compact?: boolean }) {
  const meta = metadataOf(result);
  const notices: React.ReactNode[] = [];

  if (result.status === 'failed') {
    notices.push(
      <Notice key="failed" compact={compact} tone="error" icon="error">
        Inspection failed. No egg results were saved for this image.
      </Notice>,
    );
  }
  if (isLegacy(result)) {
    notices.push(
      <Notice key="legacy" compact={compact} tone="info" icon="history">
        Recorded before quality decisions were introduced. Raw damage and cleanliness results are
        shown; no decision was made at the time.
      </Notice>,
    );
  } else if (!meta.cleanliness_model_available) {
    notices.push(
      <Notice key="clean-missing" compact={compact} tone="warn" icon="warning">
        Cleanliness model unavailable: no egg can be marked Acceptable, so intact eggs go to review.
      </Notice>,
    );
  } else if (!meta.cleanliness_release_approved) {
    notices.push(
      <Notice key="clean-beta" compact={compact} tone="warn" icon="science">
        Cleanliness model is in beta (not release-approved). Its results are shown for information
        only, so eggs without damage are sent to review instead of being accepted.
      </Notice>,
    );
  }

  const calibration = meta.calibration;
  if (calibration?.status === 'available') {
    notices.push(
      <Notice key="calibration" compact={compact} tone="info" icon="straighten">
        {meta.size_calibrated
          ? 'Marker detected and size grades are approved: Acceptable eggs receive an A/B/C size grade.'
          : 'Marker detected. Sizes are unvalidated bounding-box estimates; size grades stay N/A until physical validation is approved.'}
      </Notice>,
    );
  } else if (calibration) {
    notices.push(
      <Notice key="calibration" compact={compact} tone="info" icon="straighten">
        No valid sizing marker
        {calibration.reason ? ` (${calibration.reason.replace(/_/g, ' ')})` : ''}: sizes and size
        grades are not available. Include the full 50 mm ArUco marker (DICT_4X4_50, ID 0) with a
        white margin to measure.
      </Notice>,
    );
  }

  for (const reason of meta.image_quality?.reasons ?? []) {
    notices.push(
      <Notice key={reason} compact={compact} tone="warn" icon="image_not_supported">
        {reasonLabel(reason)}. All eggs in this image were sent to review.
      </Notice>,
    );
  }
  if (meta.annotation_error) {
    notices.push(
      <Notice key="annotation" compact={compact} tone="warn" icon="hide_image">
        The annotated image could not be saved. Egg results are unaffected.
      </Notice>,
    );
  }
  if (result.error_message?.startsWith('CSV export failed')) {
    notices.push(
      <Notice key="csv" compact={compact} tone="warn" icon="table">
        Saved to the database, but the CSV export failed.
      </Notice>,
    );
  }

  if (notices.length === 0) return null;
  return (
    <ul aria-label="Inspection notices" className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {notices}
    </ul>
  );
}
