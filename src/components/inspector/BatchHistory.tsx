import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { BatchRecord } from '../../types';

interface BatchHistoryProps {
  onOpen: (batch: BatchRecord) => void;
  refreshKey?: number;
}

export function BatchHistory({ refreshKey, onOpen }: BatchHistoryProps) {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .getPredictions(0, 20)
      .then((items: BatchRecord[]) => {
        if (active) setBatches(items);
      })
      .catch(() => {
        if (active) setBatches([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <section className="flex flex-col gap-space-sm bg-white/70 backdrop-blur-2xl border border-white/80 rounded-3xl p-space-md shadow-[0_12px_36px_0_rgba(0,80,203,0.06)]">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-lg text-headline-lg text-[#181c1f] uppercase tracking-tight font-bold">
          Batch History
        </h2>
        <span className="font-code-metric text-label-sm text-[#727687]">
          {loading ? 'LOADING' : `${batches.length} RECORDED`}
        </span>
      </div>
      {!loading && batches.length === 0 && (
        <p className="font-body-md text-body-md text-[#727687]">
          No recorded batches yet.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {batches.map((batch) => (
          <button
            type="button"
            key={batch.id}
            onClick={() => onOpen(batch)}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left hover:border-blue-300 transition-colors"
          >
            <span className="font-code-metric text-label-sm text-[#424656]">
              {new Date(batch.batch_recorded_at ?? batch.created_at).toLocaleString()}
            </span>
            <span className="font-code-metric text-label-sm text-[#0050cb]">
              OK {batch.okay_count} · STAINED {batch.stained_count} · DAMAGED {batch.batch_damaged_count}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
