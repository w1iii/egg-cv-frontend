import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Prediction, PredictionDetail } from '../types';
import { Navbar } from '../components/Navbar';

function Metric({ label, value, tone = 'text-slate-900' }: { label: string; value: number; tone?: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p></div>;
}

function HistoryCard({ batch, onClick }: { batch: Prediction; onClick: () => void }) {
  const recorded = batch.batch_recorded;
  const okay = recorded ? batch.okay_count : batch.not_damaged_count;
  const stained = recorded ? batch.stained_count : 0;
  const damaged = recorded ? batch.batch_damaged_count : batch.damaged_count;
  const review = recorded ? batch.batch_review_count : batch.needs_review_count;
  return <button onClick={onClick} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{batch.tray_id ? `TRAY-${batch.tray_id.slice(0, 8).toUpperCase()}` : batch.file_name}</h3><p className="mt-1 text-xs text-slate-500">{new Date(batch.batch_recorded_at ?? batch.created_at).toLocaleString()}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${batch.status === 'failed' ? 'bg-red-50 text-red-700' : review ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{batch.status === 'failed' ? 'Failed' : review ? 'Review' : recorded ? 'Recorded' : 'Not recorded'}</span></div>
    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-5"><span className="text-slate-500">Eggs <b className="text-slate-800">{batch.total_detections}</b></span><span className="text-emerald-700">Okay <b>{okay}</b></span><span className="text-amber-700">Stained <b>{stained}</b></span><span className="text-red-700">Damaged <b>{damaged}</b></span><span className="text-orange-700">Review <b>{review}</b></span></div>
  </button>;
}

export function BatchHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [selected, setSelected] = useState<PredictionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [limit, setLimit] = useState(20);

  const load = () => {
    setLoading(true);
    apiClient.getPredictions(0, 100).then((results: Prediction[]) => {
      setItems(results.filter((item) => item.batch_recorded));
      setError('');
    }).catch(() => setError('Could not load batch history. Please try again.')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openBatch = async (batch: Prediction) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const detail = await apiClient.getPrediction(batch.id) as PredictionDetail;
      setSelected(detail);
    } catch {
      setError('Could not load batch details. Please try again.');
    } finally { setDetailLoading(false); }
  };

  useEffect(() => {
    const id = Number(searchParams.get('batch'));
    const match = items.find((item) => item.id === id);
    if (match && !selected) void openBatch(match);
  }, [items, searchParams]);

  const filtered = useMemo(() => items.filter((item) => {
    const term = query.trim().toLowerCase();
    if (term && !item.tray_id.toLowerCase().includes(term) && !item.file_name.toLowerCase().includes(term)) return false;
    const when = new Date(item.batch_recorded_at ?? item.created_at);
    const now = new Date();
    if (dateFilter === 'today' && when.toDateString() !== now.toDateString()) return false;
    if (dateFilter === '7days' && now.getTime() - when.getTime() > 7 * 86400000) return false;
    const damaged = item.batch_damaged_count > 0;
    const review = item.batch_review_count > 0;
    if (resultFilter === 'damaged' && !damaged) return false;
    if (resultFilter === 'review' && !review) return false;
    if (resultFilter === 'okay' && (damaged || review)) return false;
    return true;
  }), [items, query, dateFilter, resultFilter]);

  const totals = items.reduce((acc, item) => ({
    eggs: acc.eggs + item.total_detections,
    damaged: acc.damaged + item.batch_damaged_count,
    review: acc.review + item.batch_review_count,
    okay: acc.okay + item.okay_count,
  }), { eggs: 0, damaged: 0, review: 0, okay: 0 });

  return <main className="min-h-screen bg-[#f5f8fc] pb-24 sm:pb-8">
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-3 sm:gap-7 sm:p-6 lg:p-8"><Navbar />
      <section><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Inspection records</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Batch History</h1><p className="mt-1 text-sm text-slate-500">Search and review saved tray results.</p></section>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error} <button onClick={load} className="ml-2 font-bold underline">Retry</button></div>}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Recorded batches" value={items.length} /><Metric label="Eggs processed" value={totals.eggs} /><Metric label="Damaged" value={totals.damaged} tone="text-red-700" /><Metric label="Needs review" value={totals.review} tone="text-amber-700" /></section>
      <section className="rounded-2xl border border-white bg-white/85 p-3 shadow-sm sm:p-5"><div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]"><input aria-label="Search tray or file" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(20); }} placeholder="Search tray ID or file name" className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"/><select aria-label="Filter by date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="all">All dates</option><option value="today">Today</option><option value="7days">Last 7 days</option></select><select aria-label="Filter by result" value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="all">All results</option><option value="damaged">Has damaged eggs</option><option value="review">Needs review</option><option value="okay">No damage/review</option></select><button onClick={() => { setQuery(''); setDateFilter('all'); setResultFilter('all'); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600">Clear</button></div></section>
      <section><div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-slate-900">Recorded batches</h2><span className="text-xs text-slate-500">{filtered.length} results</span></div>{loading ? <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">Loading batch history…</p> : filtered.length ? <div className="grid gap-3">{filtered.slice(0, limit).map((batch) => <HistoryCard key={batch.id} batch={batch} onClick={() => void openBatch(batch)} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No matching recorded batches.</div>}{filtered.length > limit && <button onClick={() => setLimit((value) => value + 20)} className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Load more</button>}</section>
    </div>
    {(selected || detailLoading) && <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/35" onClick={(e) => { if (e.target === e.currentTarget) { setSelected(null); setSearchParams({}); } }}><aside aria-label="Batch details" className="h-full w-full overflow-y-auto bg-[#f8fafc] p-4 shadow-2xl sm:max-w-xl sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Batch details</p><h2 className="mt-1 text-xl font-bold text-slate-900">{selected?.tray_id ? `TRAY-${selected.tray_id.slice(0, 8).toUpperCase()}` : 'Loading…'}</h2></div><button aria-label="Close details" onClick={() => { setSelected(null); setSearchParams({}); }} className="rounded-full bg-white px-3 py-2 text-slate-700 shadow-sm">✕</button></div>{detailLoading ? <p className="py-12 text-center text-slate-500">Loading details…</p> : selected && <><p className="text-sm text-slate-500">{new Date(selected.batch_recorded_at ?? selected.created_at).toLocaleString()} · {selected.file_name}</p><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Total eggs" value={selected.total_detections} /><Metric label="Okay" value={selected.okay_count} tone="text-emerald-700"/><Metric label="Stained" value={selected.stained_count} tone="text-amber-700"/><Metric label="Damaged" value={selected.batch_damaged_count} tone="text-red-700"/><Metric label="Needs review" value={selected.batch_review_count} tone="text-orange-700"/><Metric label="Processing ms" value={selected.processing_time_ms ?? 0}/></div><h3 className="mb-3 mt-7 font-bold text-slate-900">Egg results</h3><div className="space-y-2">{selected.detection_boxes.map((egg, index) => <article key={egg.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between"><span className="font-semibold text-slate-800">Egg {String(egg.egg_id ?? index + 1).padStart(2, '0')}</span><span className={`rounded-full px-2 py-1 text-xs font-bold ${egg.requires_review ? 'bg-amber-50 text-amber-800' : egg.damage_status === 'Damaged' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{egg.requires_review ? 'Needs review' : egg.grade ?? egg.damage_status ?? 'Unclassified'}</span></div><p className="mt-2 text-sm text-slate-600">Damage: {egg.damage_status ?? '—'} · Cleanliness: {egg.cleanliness_status ?? '—'}</p></article>)}</div>{selected.annotated_url && <a className="mt-5 block rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-bold text-white" href={selected.annotated_url} target="_blank" rel="noreferrer">Open annotated image</a>}</>}</aside></div>}
  </main>;
}
