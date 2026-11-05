import { DetectionBox } from '../../types';
import { formatMetric } from '../../utils/grading';

interface EggResultCardProps {
  box: DetectionBox;
  index: number;
  thumbnail?: string;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-label-sm text-label-sm text-[#727687] uppercase tracking-wide">
        {label}
      </span>
      <span className="font-body-sm text-body-sm text-[#181c1f] font-medium truncate">
        {value}
      </span>
    </div>
  );
}

export function EggResultCard({
  box,
  index,
  thumbnail,
}: EggResultCardProps) {
  const confidence = Math.round(box.confidence.detection * 100);
  const eggId = String(box.egg_id ?? index).padStart(2, '0');

  return (
    <div
      className="flex flex-col bg-white/85 backdrop-blur-xl border border-slate-200 rounded-2xl p-space-sm shadow-[0_4px_16px_0_rgba(0,80,203,0.06)] hover:bg-white hover:shadow-[0_8px_24px_rgba(0,102,255,0.12)] transition-all"
      id={`egg-card-${index}`}
    >
      <div className="flex items-start justify-between gap-space-xs pb-space-xs">
        <div className="flex items-center gap-space-xs min-w-0">
          <span className="font-headline-md text-headline-md text-[#181c1f] font-semibold">
            Egg #{index}
          </span>
          <span className="font-label-sm text-label-sm text-[#727687] truncate">
            ID: {eggId}
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-video rounded-xl overflow-hidden my-space-xs bg-slate-100 border border-slate-200/80">
        {thumbnail ? (
          <img
            className="w-full h-full object-cover"
            src={thumbnail}
            alt={`Cropped inspection frame for egg ${index}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-50 to-blue-50 text-slate-400">
            <span className="material-symbols-outlined text-[30px]">egg</span>
            <span className="font-label-sm text-label-sm">NO CROP</span>
          </div>
        )}
        <div
          className="absolute bottom-1 right-1 bg-white/90 backdrop-blur border border-slate-200 px-1.5 py-0.5 rounded font-code-metric text-label-sm font-bold shadow-xs text-slate-700"
        >
          {confidence}% INT
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-space-sm gap-y-space-xs pt-space-xs border-t border-slate-100">
        <Metric label="Damage" value={formatMetric(box.damage_status)} />
        <Metric
          label="Cleanliness"
          value={formatMetric(box.cleanliness_status)}
        />
      </div>

    </div>
  );
}

export function EggResultPlaceholder({ index }: { index: number }) {
  return (
    <div className="flex flex-col bg-white/50 backdrop-blur-xl border border-dashed border-slate-300/80 rounded-2xl p-space-sm min-h-[210px]">
      <div className="flex items-center justify-between pb-space-xs">
        <span className="font-headline-md text-headline-md text-slate-400 font-semibold">
          Egg #{index}
        </span>
        <span className="px-space-xs py-0.5 bg-slate-100 border border-slate-200 text-slate-400 font-label-sm text-label-sm rounded font-bold uppercase">
          Awaiting
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50/70 border border-slate-100">
        <span className="material-symbols-outlined text-[34px] text-slate-300">
          egg
        </span>
        <span className="font-code-metric text-label-sm text-slate-400">
          NO FRAME DATA
        </span>
      </div>
    </div>
  );
}
