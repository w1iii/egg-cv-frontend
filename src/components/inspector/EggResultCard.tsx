import { DetectionBox } from '../../types';
import { decisionMeta, formatMetric, formatPercent, gradeLabel } from '../../utils/decisions';
import { DecisionBadge, ReasonList } from '../DecisionBadge';

interface EggResultCardProps {
  box: DetectionBox;
  index: number;
  thumbnail?: string;
  cleanlinessApproved: boolean;
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="font-label-sm text-label-sm uppercase tracking-wide text-[#5b6170]">
        {label}
        {note && (
          <span className="ml-1 rounded bg-slate-100 px-1 py-px text-[10px] font-bold normal-case tracking-normal text-slate-600">
            {note}
          </span>
        )}
      </dt>
      <dd className="truncate font-body-sm text-body-sm font-medium text-[#181c1f]">{value}</dd>
    </div>
  );
}

function withConfidence(status: string | null | undefined, confidence: number | null | undefined) {
  if (!status) return '—';
  return confidence == null ? status : `${status} · ${formatPercent(confidence)}`;
}

export function EggResultCard({ box, index, thumbnail, cleanlinessApproved }: EggResultCardProps) {
  const eggId = String(box.egg_id ?? index).padStart(2, '0');
  const meta = decisionMeta(box.decision);
  const length = box.geometry.length_mm;
  const breadth = box.geometry.breadth_mm;

  return (
    <article
      aria-label={`Egg ${eggId}: ${meta.label}`}
      className={`flex flex-col rounded-2xl border-2 bg-white/90 p-space-sm shadow-[0_4px_16px_0_rgba(0,80,203,0.06)] ${meta.borderClass}`}
      id={`egg-card-${index}`}
    >
      <header className="flex items-start justify-between gap-space-xs pb-space-xs">
        <h3 className="font-headline-md text-headline-md font-semibold text-[#181c1f]">Egg {eggId}</h3>
        <DecisionBadge decision={box.decision} size="sm" />
      </header>

      <div className="relative my-space-xs aspect-video w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
        {thumbnail ? (
          <img className="h-full w-full object-cover" src={thumbnail} alt={`Crop of egg ${eggId}`} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-50 to-blue-50 text-slate-500">
            <span aria-hidden="true" className="material-symbols-outlined text-[30px]">egg</span>
            <span className="font-label-sm text-label-sm">No crop preview</span>
          </div>
        )}
        <span className="absolute bottom-1 right-1 rounded border border-slate-200 bg-white/90 px-1.5 py-0.5 font-code-metric text-label-sm font-bold text-slate-700">
          Detection {formatPercent(box.confidence.detection)}
        </span>
      </div>

      {box.decision && box.decision !== 'Acceptable' && (
        <div className="mb-space-xs rounded-lg bg-slate-50 px-2.5 py-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
            {box.decision === 'Reject' ? 'Rejected because' : 'Review because'}
          </p>
          <ReasonList reasons={box.decision_reason} className="mt-1" />
        </div>
      )}
      {!box.decision && (
        <p className="mb-space-xs rounded-lg bg-slate-50 px-2.5 py-2 text-sm text-slate-600">
          Recorded before quality decisions existed.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-space-sm gap-y-space-xs border-t border-slate-100 pt-space-xs">
        <Metric label="Damage" value={withConfidence(box.damage_status, box.confidence.damage)} />
        <Metric
          label="Cleanliness"
          note={cleanlinessApproved ? undefined : 'beta'}
          value={withConfidence(box.cleanliness_status, box.confidence.cleanliness)}
        />
        <Metric label="Size grade" value={gradeLabel(box.grade)} />
        <Metric label="Size" value={formatMetric(box.size, '', 'Unknown')} />
        <Metric label="Length" value={length == null ? '—' : `${length.toFixed(1)} mm`} />
        <Metric label="Breadth" value={breadth == null ? '—' : `${breadth.toFixed(1)} mm`} />
      </dl>
    </article>
  );
}
