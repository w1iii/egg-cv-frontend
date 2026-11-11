import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DashboardStats, HealthStatus, Prediction } from '../types';
import { Navbar } from '../components/Navbar';

const emptyStats: DashboardStats = {
  total_predictions: 0,
  total_images: 0,
  total_detections: 0,
  damaged_percentage: 0,
  avg_processing_time_ms: 0,
  recent_predictions: [],
};

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <article className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</article>;
}

function batchStatus(item: Prediction) {
  if (item.status === 'failed') return 'Failed';
  if (item.needs_review_count > 0 || item.batch_review_count > 0) return 'Review';
  return 'Complete';
}

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
      .catch(() => { if (active) setError('Dashboard data is unavailable. Check connection and try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const recent = stats.recent_predictions ?? [];
  const recentOkay = recent.reduce((sum, item) => sum + (item.batch_recorded ? item.okay_count : item.not_damaged_count), 0);
  const recentStained = recent.reduce((sum, item) => sum + (item.batch_recorded ? item.stained_count : 0), 0);
  const recentDamaged = recent.reduce((sum, item) => sum + (item.batch_recorded ? item.batch_damaged_count : item.damaged_count), 0);
  const recentReview = recent.reduce((sum, item) => sum + (item.batch_recorded ? item.batch_review_count : item.needs_review_count), 0);

  return <main className="min-h-screen bg-[#f5f8fc] pb-24 sm:pb-8">
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-3 sm:gap-7 sm:p-6 lg:p-8">
      <Navbar />
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Operations overview</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Egg Grading Dashboard</h1><p className="mt-1 text-sm text-slate-500">Inspection totals and recent batch outcomes.</p></div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${health?.status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}><span className={`h-2 w-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />{health?.status === 'healthy' ? 'System online' : health ? 'System degraded' : 'Checking system'}</div>
      </section>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        <Metric label="Inspections" value={loading ? '—' : stats.total_predictions.toLocaleString()} />
        <Metric label="Images processed" value={loading ? '—' : stats.total_images.toLocaleString()} />
        <Metric label="Eggs detected" value={loading ? '—' : stats.total_detections.toLocaleString()} />
        <Metric label="Damaged egg rate" value={loading ? '—' : `${stats.damaged_percentage.toFixed(1)}%`} />
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Recent batch quality</h2><p className="mt-1 text-xs text-slate-500">From latest {recent.length} inspections</p></div><Link className="text-sm font-semibold text-blue-700" to="/history">History →</Link></div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Okay', recentOkay, 'text-emerald-700'], ['Stained', recentStained, 'text-amber-700'], ['Damaged', recentDamaged, 'text-red-700'], ['Review', recentReview, 'text-orange-700']].map(([label, value, color]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${color}`}>{loading ? '—' : value}</p></div>)}
          </div>
        </article>
        <article className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:p-6"><h2 className="font-bold text-slate-900">System components</h2><div className="mt-4 space-y-3">{[['Database', health?.database_connected], ['Egg detector', health?.model_loaded], ['Damage model', health?.damage_model_loaded], ['Cleanliness model', health?.cleanliness_model_loaded]].map(([label, ready]) => <div key={String(label)} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"><span className="text-sm text-slate-600">{label}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{ready ? 'Ready' : health ? 'Unavailable' : 'Checking'}</span></div>)}</div></article>
      </section>
      <section className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Recent inspections</h2><p className="mt-1 text-xs text-slate-500">Latest processed images and batch totals</p></div><Link to="/history" className="text-sm font-semibold text-blue-700">View history →</Link></div>
        {recent.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">{loading ? 'Loading inspections…' : 'No inspections recorded yet.'}</p> : <div className="space-y-2">{recent.map((item) => <Link key={item.id} to={`/history?batch=${item.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 hover:border-blue-200"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.tray_id ? `Tray ${item.tray_id.slice(0, 8).toUpperCase()}` : item.file_name}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.batch_recorded_at ?? item.created_at).toLocaleString()} · {item.total_detections} eggs</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{batchStatus(item)}</span></Link>)}</div>}
      </section>
      <div className="flex flex-col gap-3 sm:flex-row"><Link to="/inspect" className="hidden rounded-xl bg-blue-700 px-5 py-3 text-center text-sm font-bold text-white hover:bg-blue-800 sm:block">Start inspection</Link><Link to="/history" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700">Browse batch history</Link></div>
    </div>
  </main>;
}
