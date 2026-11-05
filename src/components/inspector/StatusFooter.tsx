import { HealthStatus, PredictionDetail } from '../../types';

interface StatusFooterProps {
  health: HealthStatus | null;
  result: PredictionDetail | null;
  onExport: () => void;
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full ${
        online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
      }`}
    />
  );
}

export function StatusFooter({
  health,
  result,
  onExport,
}: StatusFooterProps) {
  return (
    <footer className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md bg-white/60 backdrop-blur-2xl border border-white/80 rounded-2xl px-space-md py-space-sm shadow-sm">
      <div className="flex items-center gap-space-xs text-[#727687] font-body-sm text-body-sm">
        <StatusDot online={health?.status === 'healthy'} />
        <span>{health?.status === 'healthy' ? 'System online' : 'System unavailable'}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-space-sm">
        <div className="flex items-center gap-space-xs text-[#727687] font-body-sm text-body-sm">
          <span>Shortcuts</span>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-code-metric text-label-sm">
            Space
          </kbd>
          <span>capture</span>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-code-metric text-label-sm">
            U
          </kbd>
          <span>upload</span>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={!result}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 font-code-metric text-label-sm text-[#0050cb] font-bold hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">
            download
          </span>
          EXPORT JSON
        </button>
      </div>
    </footer>
  );
}
