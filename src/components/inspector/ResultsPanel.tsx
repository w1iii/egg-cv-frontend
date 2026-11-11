import { useState } from 'react';
import { PredictionDetail } from '../../types';
import { resolveApiUrl } from '../../api/client';
import { EggResultCard, EggResultPlaceholder } from './EggResultCard';

interface ResultsPanelProps {
  result: PredictionDetail | null;
  crops: Record<number, string>;
  onRecordBatch: () => void;
  recording: boolean;
  batchCounts: BatchCounts;
}

export interface BatchCounts {
  good: number;
  stained: number;
  damaged: number;
}

const GRID_CLASS =
  'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-space-sm sm:gap-space-md';

function AnnotatedPreview({ url, trayId }: { url: string; trayId: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-space-sm rounded-2xl border border-slate-200 bg-slate-50/60 p-space-sm">
      <img
        src={resolveApiUrl(url)}
        alt={`Annotated image for ${trayId}`}
        className="h-40 w-full rounded-xl border border-slate-200 bg-white object-contain sm:h-32 sm:w-auto sm:max-w-[45%]"
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <div className="flex flex-col gap-space-xs">
        <span className="font-code-metric text-label-sm text-[#424656] font-bold">
          ANNOTATED FRAME
        </span>
        <span className="font-body-md text-body-md text-[#727687]">
          Detector boxes overlaid on the uploaded tray.
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

export function ResultsPanel({
  result,
  crops,
  onRecordBatch,
  recording,
  batchCounts,
}: ResultsPanelProps) {
  const boxes = result?.detection_boxes ?? [];
  const counts = boxes.reduce(
    (summary, box) => {
      if (box.damage_status === 'Damaged') {
        summary.damaged += 1;
      } else if (box.cleanliness_status === 'Stained') {
        summary.stained += 1;
      } else {
        summary.okay += 1;
      }
      return summary;
    },
    { okay: 0, stained: 0, damaged: 0 },
  );
  const trayLabel = result
    ? `Tray #${result.tray_id.slice(0, 8).toUpperCase()}`
    : 'Awaiting Image';
  const processingTime = result?.processing_time_ms
    ? `${(result.processing_time_ms / 1000).toFixed(2)}s`
    : '—';
  const metadata = (result?.inference_metadata ?? {}) as Record<
    string,
    unknown
  >;
  const maxTrayEggs = Number(metadata.max_tray_eggs) || 5;
  const cardCount = Math.max(boxes.length, maxTrayEggs);
  return (
    <section className="flex flex-col bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl p-space-sm sm:p-space-md shadow-[0_12px_36px_0_rgba(0,80,203,0.06)] gap-space-md">
      <div className="flex flex-col gap-space-sm rounded-2xl border border-emerald-100 bg-emerald-50/60 p-space-sm sm:p-space-md">
        <div className="flex flex-col gap-space-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-headline-md text-headline-md text-[#181c1f] uppercase tracking-tight font-bold">
              Current Batch
            </h2>
            <p className="font-body-sm text-body-sm text-[#727687]">
              Counts reflect the last image until it is recorded.
            </p>
          </div>
          {result && (
            <button
              type="button"
              onClick={onRecordBatch}
              disabled={recording || result.batch_recorded || boxes.length === 0}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0050cb] px-3 py-1.5 font-code-metric text-label-sm text-white font-bold hover:bg-[#003f9e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
            >
              <span className="material-symbols-outlined text-[16px]">
                {recording ? 'sync' : 'save'}
              </span>
              {result.batch_recorded ? 'BATCH RECORDED' : 'RECORD BATCH'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-space-sm">
          <Count label="GOOD EGGS" value={batchCounts.good} tone="text-emerald-700" />
          <Count label="STAINED" value={batchCounts.stained} tone="text-amber-700" />
          <Count label="DAMAGED" value={batchCounts.damaged} tone="text-red-700" />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-sm bg-gradient-to-r from-blue-50/80 to-emerald-50/50 border border-blue-100/60 p-space-sm sm:p-space-md rounded-2xl">
        <div className="flex items-center gap-space-sm min-w-0">
          <span className="material-symbols-outlined text-[#0066ff] text-[22px] shrink-0">
            analytics
          </span>
          <span className="font-headline-lg text-base leading-snug text-[#181c1f] uppercase tracking-tight font-bold truncate sm:text-headline-lg">
            Last Image Results — {trayLabel}
          </span>
        </div>

        {result && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm rounded-2xl border border-slate-200 bg-white/80 p-space-sm sm:p-space-md">
            <div className="grid grid-cols-3 gap-2 flex-1 sm:gap-space-sm">
              <Count label="OKAY" value={counts.okay} tone="text-emerald-700" />
              <Count label="STAINED" value={counts.stained} tone="text-amber-700" />
              <Count label="DAMAGED" value={counts.damaged} tone="text-red-700" />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-space-xs">
          <span className="rounded-full bg-white/80 border border-blue-200/70 px-3 py-1 font-code-metric text-label-sm text-[#0050cb] font-bold">
            {boxes.length} / {maxTrayEggs} DETECTED
          </span>
          <span className="rounded-full bg-white/80 border border-emerald-200/70 px-3 py-1 font-code-metric text-label-sm text-emerald-700 font-bold">
            {processingTime} INFERENCE
          </span>
        </div>
      </div>

      {result?.annotated_url && (
        <AnnotatedPreview url={result.annotated_url} trayId={trayLabel} />
      )}

      {result && boxes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 px-4 py-3">
          <p className="font-body-md text-body-md text-amber-900">
            No eggs were detected in this image. Try another photo, or lower the
            confidence threshold on the backend.
          </p>
        </div>
      )}

      <div className={GRID_CLASS} id="egg-cards-grid">
        {boxes.length > 0
          ? boxes.map((box, index) => (
              <EggResultCard
                key={box.id}
                box={box}
                index={index + 1}
                thumbnail={crops[box.id]}
              />
            ))
          : Array.from({ length: cardCount }, (_, index) => (
              <EggResultPlaceholder key={`empty-${index}`} index={index + 1} />
            ))}
      </div>
    </section>
  );
}

function Count({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-2 sm:px-3">
      <div className="font-code-metric text-[10px] leading-tight text-[#727687] sm:text-label-sm">{label}</div>
      <div className={`font-headline-lg text-xl font-bold sm:text-headline-lg ${tone}`}>{value}</div>
    </div>
  );
}
