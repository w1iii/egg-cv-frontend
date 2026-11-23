import { Decision } from '../types';
import { decisionMeta, reasonLabel, splitReasons } from '../utils/decisions';

export function DecisionBadge({
  decision,
  size = 'md',
}: {
  decision: Decision | null | undefined;
  size?: 'sm' | 'md';
}) {
  const meta = decisionMeta(decision);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold ${meta.badgeClass} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

/** Human-readable list of why an egg did not come out Acceptable. */
export function ReasonList({
  reasons,
  className = '',
}: {
  reasons: string | null | undefined;
  className?: string;
}) {
  const codes = splitReasons(reasons);
  if (codes.length === 0) return null;
  return (
    <ul className={`flex flex-col gap-1 text-sm text-slate-700 ${className}`}>
      {codes.map((code) => (
        <li key={code} className="flex items-start gap-1.5">
          <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span title={code}>{reasonLabel(code)}</span>
        </li>
      ))}
    </ul>
  );
}
