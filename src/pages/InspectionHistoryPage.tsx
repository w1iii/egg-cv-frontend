import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient, resolveApiUrl } from '../api/client';
import { Decision, InspectionFilters, Prediction, PredictionDetail } from '../types';
import { Navbar } from '../components/Navbar';
import { DecisionBadge, ReasonList } from '../components/DecisionBadge';
import { InspectionNotices } from '../components/InspectionNotices';
import {
  DECISIONS,
  DECISION_META,
  REASON_LABELS,
  countDecisions,
  formatPercent,
  gradeLabel,
  isLegacy,
  shortCode,
} from '../utils/decisions';
import { getErrorMessage } from '../utils/errorHandler';

const PAGE_SIZE = 20;

function Metric({ label, value, tone = 'text-slate-900' }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function statusLabel(item: Prediction): { text: string; className: string } {
  if (item.status === 'failed') return { text: 'Failed', className: 'bg-red-50 text-red-800' };
  if (item.status === 'processing') return { text: 'Processing', className: 'bg-slate-100 text-slate-700' };
  if (isLegacy(item)) return { text: 'Legacy', className: 'bg-slate-100 text-slate-700' };
  if (item.needs_review_count > 0) return { text: 'Has review', className: 'bg-amber-50 text-amber-900' };
  return { text: 'Complete', className: 'bg-emerald-50 text-emerald-800' };
}

function HistoryCard({ item, onOpen }: { item: Prediction; onOpen: () => void }) {
  const status = statusLabel(item);
  const legacy = isLegacy(item);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-900">Inspection {shortCode(item.inspection_code)}</h3>
          <p className="mt-1 truncate text-xs text-slate-600">
            {new Date(item.captured_at ?? item.created_at).toLocaleString()} · {item.file_name}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.text}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <span className="text-slate-600">Eggs <b className="text-slate-900">{item.total_detections}</b></span>
        {legacy ? (
          <>
            <span className="text-red-700">Damaged <b>{item.damaged_count}</b></span>
            <span className="col-span-2 text-slate-600">No decisions recorded</span>
          </>
        ) : (
          <>
            <span className={DECISION_META.Acceptable.countClass}>Acceptable <b>{item.acceptable_count}</b></span>
            <span className={DECISION_META.Reject.countClass}>Reject <b>{item.reject_count}</b></span>
            <span className={DECISION_META['Needs Review'].countClass}>Review <b>{item.needs_review_count}</b></span>
          </>
        )}
      </div>
    </button>
  );
}

function DetailDrawer({
  detail,
  loading,
  onClose,
}: {
  detail: PredictionDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<Decision | 'all'>('all');
  useEffect(() => setFilter('all'), [detail?.id]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const eggs = detail?.detection_boxes ?? [];
  const visible = filter === 'all' ? eggs : eggs.filter((egg) => egg.decision === filter);
  const counts = countDecisions(eggs);
  const cleanlinessApproved = Boolean(detail?.inference_metadata?.cleanliness_release_approved);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/35"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspection-detail-title"
        className="h-full w-full overflow-y-auto bg-[#f8fafc] p-4 shadow-2xl sm:max-w-xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Inspection details</p>
            <h2 id="inspection-detail-title" className="mt-1 text-xl font-bold text-slate-900">
              {detail ? `Inspection ${shortCode(detail.inspection_code)}` : 'Loading…'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close details"
            onClick={onClose}
            className="rounded-full bg-white px-3 py-2 text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            ✕
          </button>
        </div>
        {loading && <p className="py-12 text-center text-slate-600">Loading details…</p>}
        {!loading && detail && (
          <>
            <p className="text-sm text-slate-600">
              {new Date(detail.captured_at ?? detail.created_at).toLocaleString()} · {detail.file_name}
              {detail.processing_time_ms != null && ` · ${detail.processing_time_ms} ms`}
            </p>
            <div className="mt-4">
              <InspectionNotices result={detail} />
            </div>
            {!isLegacy(detail) && (
              <div className="mt-5 grid grid-cols-3 gap-2" role="group" aria-label="Filter eggs by decision">
                {DECISIONS.map((decision) => {
                  const active = filter === decision;
                  return (
                    <button
                      key={decision}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(active ? 'all' : decision)}
                      className={`rounded-xl border p-3 text-left ${active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}
                    >
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {DECISION_META[decision].label}
                      </span>
                      <span className={`block text-2xl font-bold ${DECISION_META[decision].countClass}`}>{counts[decision]}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <h3 className="mb-3 mt-7 font-bold text-slate-900">
              Egg results {filter !== 'all' && `· ${DECISION_META[filter].label.toLowerCase()}`}
            </h3>
            {eggs.length === 0 && <p className="text-sm text-slate-600">No eggs were detected in this image.</p>}
            <div className="space-y-2">
              {visible.map((egg, index) => (
                <article key={egg.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">
                      Egg {String(egg.egg_id ?? index + 1).padStart(2, '0')}
                    </span>
                    <DecisionBadge decision={egg.decision} size="sm" />
                  </div>
                  <ReasonList reasons={egg.decision_reason} className="mt-2" />
                  <p className="mt-2 text-sm text-slate-600">
                    Damage: {egg.damage_status ?? '—'} ({formatPercent(egg.confidence.damage)}) · Cleanliness
                    {cleanlinessApproved ? '' : ' (beta)'}: {egg.cleanliness_status ?? '—'} ({formatPercent(egg.confidence.cleanliness)})
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Size grade: {gradeLabel(egg.grade)} · Size: {egg.size ?? 'Unknown'} · Length:{' '}
                    {egg.geometry.length_mm == null ? '—' : `${egg.geometry.length_mm} mm`} · Detection{' '}
                    {formatPercent(egg.confidence.detection)}
                  </p>
                </article>
              ))}
            </div>
            {detail.annotated_url && (
              <a
                className="mt-5 block rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-bold text-white"
                href={resolveApiUrl(detail.annotated_url)}
                target="_blank"
                rel="noreferrer"
              >
                Open annotated image
              </a>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

export function InspectionHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [decisionFilter, setDecisionFilter] = useState<Decision | ''>('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<PredictionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filters = useMemo<InspectionFilters>(() => ({
    ...(decisionFilter ? { decision: decisionFilter } : {}),
    ...(reasonFilter ? { review_reason: reasonFilter } : {}),
  }), [decisionFilter, reasonFilter]);

  const load = useCallback(async (append = false, offset = 0) => {
    setLoading(true);
    try {
      const page = await apiClient.getInspections(offset, PAGE_SIZE, filters);
      setItems((current) => (append ? [...current, ...page] : page));
      setHasMore(page.length === PAGE_SIZE);
      setError('');
    } catch (err) {
      setError(`Could not load inspection history: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const openInspection = useCallback(async (id: number) => {
    setDetailLoading(true);
    setSelected(null);
    setSearchParams({ inspection: String(id) });
    try {
      setSelected(await apiClient.getInspection(id));
    } catch (err) {
      setError(`Could not load inspection details: ${getErrorMessage(err)}`);
      setSearchParams({});
    } finally {
      setDetailLoading(false);
    }
  }, [setSearchParams]);

  const closeDetail = useCallback(() => {
    setSelected(null);
    setDetailLoading(false);
    setSearchParams({});
  }, [setSearchParams]);

  useEffect(() => {
    const id = Number(searchParams.get('inspection'));
    if (id && !selected && !detailLoading) void openInspection(id);
  }, []); // Only react to the URL on first load.

  const filtered = useMemo(() => items.filter((item) => {
    const term = query.trim().toLowerCase();
    if (term && !item.inspection_code.toLowerCase().includes(term) && !item.file_name.toLowerCase().includes(term)) return false;
    const when = new Date(item.captured_at ?? item.created_at);
    const now = new Date();
    if (dateFilter === 'today' && when.toDateString() !== now.toDateString()) return false;
    if (dateFilter === '7days' && now.getTime() - when.getTime() > 7 * 86400000) return false;
    return true;
  }), [items, query, dateFilter]);

  const totals = filtered.reduce((acc, item) => ({
    eggs: acc.eggs + item.total_detections,
    acceptable: acc.acceptable + item.acceptable_count,
    reject: acc.reject + item.reject_count,
    review: acc.review + (isLegacy(item) ? 0 : item.needs_review_count),
  }), { eggs: 0, acceptable: 0, reject: 0, review: 0 });

  const clearFilters = () => {
    setQuery('');
    setDateFilter('all');
    setDecisionFilter('');
    setReasonFilter('');
  };

  return (
    <main className="min-h-screen bg-[#f5f8fc] pb-24 sm:pb-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-3 sm:gap-7 sm:p-6 lg:p-8">
        <Navbar />
        <section>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Inspection records</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Inspection History</h1>
          <p className="mt-1 text-sm text-slate-600">Every inspected image, with per-egg decisions and the reasons behind them.</p>
        </section>
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}{' '}
            <button type="button" onClick={() => void load()} className="ml-2 font-bold underline">Retry</button>
          </div>
        )}
        <section aria-label="Totals for the listed inspections" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric label="Inspections" value={filtered.length} />
          <Metric label="Eggs" value={totals.eggs} />
          <Metric label="Acceptable" value={totals.acceptable} tone={DECISION_META.Acceptable.countClass} />
          <Metric label="Reject" value={totals.reject} tone={DECISION_META.Reject.countClass} />
          <Metric label="Needs review" value={totals.review} tone={DECISION_META['Needs Review'].countClass} />
        </section>
        <section className="rounded-2xl border border-white bg-white/85 p-3 shadow-sm sm:p-5">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
            <input
              aria-label="Search inspection code or file name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inspection code or file name"
              className="min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
            />
            <select aria-label="Filter by date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
            </select>
            <select aria-label="Filter by egg decision" value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value as Decision | '')} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="">Any decision</option>
              {DECISIONS.map((decision) => (
                <option key={decision} value={decision}>Has {DECISION_META[decision].label.toLowerCase()} eggs</option>
              ))}
            </select>
            <select aria-label="Filter by reason" value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="">Any reason</option>
              {Object.entries(REASON_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700">
              Clear
            </button>
          </div>
        </section>
        <section aria-busy={loading}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Inspections</h2>
            <span className="text-xs text-slate-600" aria-live="polite">{loading ? 'Loading…' : `${filtered.length} shown`}</span>
          </div>
          {loading && items.length === 0 ? (
            <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-600">Loading inspection history…</p>
          ) : filtered.length ? (
            <div className="grid gap-3">
              {filtered.map((item) => (
                <HistoryCard key={item.id} item={item} onOpen={() => void openInspection(item.id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
              No matching inspections.
            </div>
          )}
          {hasMore && (
            <button
              type="button"
              disabled={loading}
              onClick={() => void load(true, items.length)}
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Load more
            </button>
          )}
        </section>
      </div>
      {(selected || detailLoading) && <DetailDrawer detail={selected} loading={detailLoading} onClose={closeDetail} />}
    </main>
  );
}
