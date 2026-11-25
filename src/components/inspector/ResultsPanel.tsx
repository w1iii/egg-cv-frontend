import { useMemo, useState } from 'react';
import { Decision, PredictionDetail } from '../../types';
import { resolveApiUrl } from '../../api/client';
import { DECISION_META, DECISIONS, countDecisions, metadataOf, shortCode } from '../../utils/decisions';
import { InspectionNotices } from '../InspectionNotices';
import { EggResultCard } from './EggResultCard';

interface ResultsPanelProps {
  result: PredictionDetail | null;
  crops: Record<number, string>;
  pending: Pick<PredictionDetail, 'id' | 'total_detections' | 'acceptable_count' | 'reject_count' | 'needs_review_count'>[];
  saving: boolean;
  busy: boolean;
  savedBatch: number | null;
  onSaveBatch: () => void;
}

const GRID_CLASS =
  'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-space-sm sm:gap-space-md';

function AnnotatedPreview({ url, label }: { url: string; label: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div className="flex flex-col gap-space-sm rounded-2xl border border-slate-200 bg-slate-50/60 p-space-sm sm:flex-row sm:items-center">
      <img
        src={resolveApiUrl(url)}
        alt={`Annotated image for ${label}`}
        className="h-40 w-full rounded-xl border border-slate-200 bg-white object-contain sm:h-32 sm:w-auto sm:max-w-[45%]"
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <div className="flex flex-col gap-space-xs">
        <span className="font-code-metric text-label-sm font-bold text-[#424656]">ANNOTATED IMAGE</span>
        <span className="font-body-md text-body-md text-[#5b6170]">
          Each detected egg is outlined and labelled with its decision.
        </span>
        <a
          href={resolveApiUrl(url)}
          target="_blank"
          rel="noreferrer"
          className="font-code-metric text-label-sm text-[#0050cb] underline"
        >
          Open image
        </a>
      </div>
    </div>
  );
}

export function ResultsPanel({ result, crops, pending, saving, busy, savedBatch, onSaveBatch }: ResultsPanelProps) {
  const [filter, setFilter] = useState<Decision | 'all'>('all');
  const boxes = useMemo(() => result?.detection_boxes ?? [], [result]);
  const counts = countDecisions(boxes);
  const visible = filter === 'all' ? boxes : boxes.filter((box) => box.decision === filter);
  const meta = metadataOf(result);
  const label = result ? `Inspection ${shortCode(result.inspection_code)}` : 'Awaiting image';
  const processingTime = result?.processing_time_ms
    ? `${(result.processing_time_ms / 1000).toFixed(2)} s`
    : '—';

  return (
    <section
      aria-labelledby="results-heading"
      className="flex flex-col gap-space-md rounded-3xl border border-white/80 bg-white/70 p-space-sm shadow-[0_12px_36px_0_rgba(0,80,203,0.06)] backdrop-blur-2xl sm:p-space-md"
    >
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">Current batch</h2>
            <p className="text-sm text-slate-600">{pending.length} inspections · {pending.reduce((n, item) => n + item.total_detections, 0)} eggs</p>
            <p className="text-sm text-slate-600">{pending.reduce((n, item) => n + item.acceptable_count, 0)} acceptable · {pending.reduce((n, item) => n + item.reject_count, 0)} reject · {pending.reduce((n, item) => n + item.needs_review_count, 0)} review</p>
            {savedBatch !== null && <p role="status" className="text-sm text-emerald-800">Batch #{savedBatch} saved. Its inspections are listed in Inspection History.</p>}
          </div>
          <button type="button" onClick={onSaveBatch} disabled={!pending.length || saving || busy} className="rounded-full bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{saving ? 'Saving…' : 'Save batch'}</button>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-space-sm rounded-2xl border border-blue-100/60 bg-gradient-to-r from-blue-50/80 to-emerald-50/50 p-space-sm sm:p-space-md xl:flex-row xl:items-center">
        <div className="flex min-w-0 items-center gap-space-sm">
          <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-[22px] text-[#0066ff]">analytics</span>
          <h2 id="results-heading" className="truncate font-headline-lg text-base font-bold uppercase leading-snug tracking-tight text-[#181c1f] sm:text-headline-lg">
            {label}
          </h2>
        </div>
        {result && (
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="rounded-full border border-blue-200/70 bg-white/80 px-3 py-1 font-code-metric text-label-sm font-bold text-[#0050cb]">
              {boxes.length} {boxes.length === 1 ? 'EGG' : 'EGGS'} DETECTED
            </span>
            <span className="rounded-full border border-emerald-200/70 bg-white/80 px-3 py-1 font-code-metric text-label-sm font-bold text-emerald-700">
              {processingTime} PROCESSING
            </span>
          </div>
        )}
      </div>

      {!result && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-600">
          Upload a photo, pick a test image or capture a camera frame. Every egg in the image is
          inspected on its own.
        </p>
      )}

      {result && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-space-sm" role="group" aria-label="Filter eggs by decision">
            {DECISIONS.map((decision) => {
              const active = filter === decision;
              return (
                <button
                  key={decision}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(active ? 'all' : decision)}
                  className={`rounded-xl border px-2 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066ff] sm:px-3 ${
                    active ? 'border-[#0066ff] bg-blue-50' : 'border-slate-200 bg-white/80 hover:border-blue-300'
                  }`}
                >
                  <span className="block font-code-metric text-[10px] leading-tight text-[#5b6170] sm:text-label-sm">
                    {DECISION_META[decision].label.toUpperCase()}
                  </span>
                  <span className={`block font-headline-lg text-xl font-bold sm:text-headline-lg ${DECISION_META[decision].countClass}`}>
                    {counts[decision]}
                  </span>
                </button>
              );
            })}
          </div>

          <InspectionNotices result={result} />

          {result.annotated_url && <AnnotatedPreview url={result.annotated_url} label={label} />}

          {result.status === 'completed' && boxes.length === 0 && (
            <div role="status" className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 px-4 py-3">
              <p className="font-body-md text-body-md text-amber-900">
                No eggs were detected in this image
                {meta.raw_detection_count ? ' (all candidate boxes were removed as duplicates or invalid)' : ''}.
                Check framing and lighting, then try again.
              </p>
            </div>
          )}

          {filter !== 'all' && (
            <p className="text-sm text-slate-600">
              Showing {visible.length} of {boxes.length} eggs ({DECISION_META[filter].label.toLowerCase()}).{' '}
              <button type="button" className="font-semibold text-[#0050cb] underline" onClick={() => setFilter('all')}>
                Show all
              </button>
            </p>
          )}

          <div className={GRID_CLASS} id="egg-cards-grid">
            {visible.map((box) => (
              <EggResultCard
                key={box.id}
                box={box}
                index={boxes.indexOf(box) + 1}
                thumbnail={crops[box.id]}
                cleanlinessApproved={Boolean(meta.cleanliness_release_approved)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
