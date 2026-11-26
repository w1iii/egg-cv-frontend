import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DashboardStats, HealthStatus, Prediction } from '../types';
import { Navbar } from '../components/Navbar';
import { DECISION_META, isLegacy, shortCode } from '../utils/decisions';

const emptyStats: DashboardStats = {
  total_predictions: 0,
  total_images: 0,
  total_detections: 0,
  acceptable_count: 0,
  reject_count: 0,
  needs_review_count: 0,
  undecided_count: 0,
  damaged_percentage: 0,
  avg_processing_time_ms: 0,
  recent_predictions: [],
};

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-600">{note}</p>}
    </article>
  );
}

function inspectionStatus(item: Prediction) {
  if (item.status === 'failed') return 'Failed';
  if (isLegacy(item)) return 'Legacy';
  if (item.needs_review_count > 0) return 'Has review';
  return 'Complete';
}

type ComponentState = 'ready' | 'beta' | 'off' | 'missing' | 'checking';

const STATE_STYLE: Record<ComponentState, { text: string; className: string }> = {
  ready: { text: 'Ready', className: 'bg-emerald-50 text-emerald-800' },
  beta: { text: 'Loaded · not approved', className: 'bg-amber-50 text-amber-900' },
  off: { text: 'Disabled', className: 'bg-slate-100 text-slate-700' },
  missing: { text: 'Unavailable', className: 'bg-red-50 text-red-800' },
  checking: { text: 'Checking', className: 'bg-slate-100 text-slate-600' },
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([apiClient.getDashboardStats(), apiClient.getHealth()])
      .then(([data, status]) => {
        if (!active) return;
        setStats(data);
        setHealth(status);
      })
      .catch(() => {
        if (active) setError('Dashboard data is unavailable. Check the connection and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const recent = stats.recent_predictions ?? [];
  const show = (value: number | null | undefined) =>
    loading || typeof value !== 'number' || !Number.isFinite(value) ? '—' : value.toLocaleString();
  const damagedPercentage = typeof stats.damaged_percentage === 'number' && Number.isFinite(stats.damaged_percentage)
    ? `${stats.damaged_percentage.toFixed(1)}%`
    : '—';
  const averageProcessingTime = typeof stats.avg_processing_time_ms === 'number' && Number.isFinite(stats.avg_processing_time_ms)
    ? `${Math.round(stats.avg_processing_time_ms)} ms`
    : '—';
  const loaded = (flag: boolean | undefined): ComponentState => (!health ? 'checking' : flag ? 'ready' : 'missing');
  const components: [string, ComponentState][] = [
    ['Database', loaded(health?.database_connected)],
    ['Egg detector', loaded(health?.model_loaded)],
    ['Damage model', loaded(health?.damage_model_loaded)],
    [
      'Cleanliness model',
      !health ? 'checking' : !health.cleanliness_model_loaded ? 'missing' : health.cleanliness_release_approved ? 'ready' : 'beta',
    ],
    ['Size grades (A/B/C)', !health ? 'checking' : health.size_grades_approved ? 'ready' : 'off'],
  ];

  return (
    <main className="min-h-screen bg-[#f5f8fc] pb-24 sm:pb-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-3 sm:gap-7 sm:p-6 lg:p-8">
        <Navbar />
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Operations overview</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Egg Inspection Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Inspection totals, egg decisions and system readiness.</p>
          </div>
          <div
            role="status"
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
              health?.status === 'healthy' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
            }`}
          >
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {health?.status === 'healthy' ? 'System online' : health ? 'System degraded' : 'Checking system'}
          </div>
        </section>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Metric label="Inspections" value={show(stats.total_predictions)} note="One per image" />
          <Metric label="Eggs inspected" value={show(stats.total_detections)} />
          <Metric label="Damaged egg rate" value={loading ? '—' : damagedPercentage} note="Damage classifier output, all eggs" />
          <Metric label="Avg processing" value={loading ? '—' : averageProcessingTime} />
        </section>
        <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <article className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Egg decisions</h2>
                <p className="mt-1 text-xs text-slate-600">All inspections</p>
              </div>
              <Link className="text-sm font-semibold text-blue-700" to="/history">History →</Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ['Acceptable', stats.acceptable_count, DECISION_META.Acceptable.countClass],
                ['Reject', stats.reject_count, DECISION_META.Reject.countClass],
                ['Needs review', stats.needs_review_count, DECISION_META['Needs Review'].countClass],
                ['Legacy (no decision)', stats.undecided_count, 'text-slate-600'],
              ] as [string, number, string][]).map(([label, value, color]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">{label}</p>
                  <p className={`mt-1 text-2xl font-bold ${color}`}>{show(value)}</p>
                </div>
              ))}
            </div>
            {health && !health.cleanliness_release_approved && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
                The cleanliness model is not release-approved, so eggs without damage are sent to review rather than accepted.
              </p>
            )}
          </article>
          <article className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">System components</h2>
            <dl className="mt-4 space-y-3">
              {components.map(([label, state]) => (
                <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                  <dt className="text-sm text-slate-700">{label}</dt>
                  <dd className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_STYLE[state].className}`}>{STATE_STYLE[state].text}</dd>
                </div>
              ))}
            </dl>
          </article>
        </section>
        <section className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Recent inspections</h2>
              <p className="mt-1 text-xs text-slate-600">Latest processed images</p>
            </div>
            <Link to="/history" className="text-sm font-semibold text-blue-700">View history →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">{loading ? 'Loading inspections…' : 'No inspections yet.'}</p>
          ) : (
            <div className="space-y-2">
              {recent.map((item) => (
                <Link key={item.id} to={`/history?inspection=${item.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 hover:border-blue-200">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">Inspection {shortCode(item.inspection_code)}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {new Date(item.captured_at ?? item.created_at).toLocaleString()} · {item.total_detections} eggs
                      {!isLegacy(item) && ` · ${item.acceptable_count} acceptable · ${item.reject_count} reject · ${item.needs_review_count} review`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{inspectionStatus(item)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/inspect" className="hidden rounded-xl bg-blue-700 px-5 py-3 text-center text-sm font-bold text-white hover:bg-blue-800 sm:block">Start inspection</Link>
          <Link to="/history" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700">Browse inspection history</Link>
        </div>
      </div>
    </main>
  );
}
