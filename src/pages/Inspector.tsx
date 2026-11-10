import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client';
import { CapturedFrame, HealthStatus, PredictionDetail } from '../types';
import { getErrorMessage } from '../utils/errorHandler';
import {
  buildCropThumbnails,
  fetchImageFile,
  fileToFrame,
} from '../utils/frames';
import { ImageDropzone } from '../components/inspector/ImageDropzone';
import { LiveCameraCapture } from '../components/inspector/LiveCameraCapture';
import { SampleImageTray } from '../components/inspector/SampleImageTray';
import { BatchCounts, ResultsPanel } from '../components/inspector/ResultsPanel';
import { StatusFooter } from '../components/inspector/StatusFooter';
import { Navbar } from '../components/Navbar';

const INSPECTOR_STORAGE_KEY = 'egg-cv:inspector-state';

interface PersistedInspectorState {
  result: PredictionDetail | null;
  crops: Record<number, string>;
  batchCounts: BatchCounts;
}

const emptyBatchCounts: BatchCounts = {
  good: 0,
  stained: 0,
  damaged: 0,
};

function isBatchCounts(value: unknown): value is BatchCounts {
  if (!value || typeof value !== 'object') return false;
  const counts = value as Record<string, unknown>;
  return (
    typeof counts.good === 'number' &&
    typeof counts.stained === 'number' &&
    typeof counts.damaged === 'number'
  );
}

function readPersistedState(): PersistedInspectorState {
  try {
    const stored = window.localStorage.getItem(INSPECTOR_STORAGE_KEY);
    if (!stored) {
      return { result: null, crops: {}, batchCounts: emptyBatchCounts };
    }

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      return { result: null, crops: {}, batchCounts: emptyBatchCounts };
    }

    const state = parsed as Record<string, unknown>;
    const result =
      state.result && typeof state.result === 'object'
        ? (state.result as PredictionDetail)
        : null;
    const crops =
      state.crops && typeof state.crops === 'object'
        ? (state.crops as Record<number, string>)
        : {};

    return {
      result,
      crops,
      batchCounts: isBatchCounts(state.batchCounts)
        ? state.batchCounts
        : emptyBatchCounts,
    };
  } catch {
    return { result: null, crops: {}, batchCounts: emptyBatchCounts };
  }
}

export function Inspector() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisInFlightRef = useRef(false);
  const [persistedState] = useState<PersistedInspectorState>(
    readPersistedState,
  );
  const [result, setResult] = useState<PredictionDetail | null>(
    persistedState.result,
  );
  const [crops, setCrops] = useState<Record<number, string>>(
    persistedState.crops,
  );
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [recording, setRecording] = useState(false);
  const [batchCounts, setBatchCounts] = useState<BatchCounts>(
    persistedState.batchCounts,
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        INSPECTOR_STORAGE_KEY,
        JSON.stringify({ result, crops, batchCounts }),
      );
    } catch {
      setError('Unable to save inspection data in this browser.');
    }
  }, [batchCounts, crops, result]);

  useEffect(() => {
    let active = true;
    const loadHealth = async () => {
      try {
        const status = await apiClient.getHealth();
        if (active) setHealth(status);
      } catch {
        if (active) setHealth(null);
      }
    };
    void loadHealth();
    const timer = window.setInterval(loadHealth, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const analyzeFrame = useCallback(async (frame: CapturedFrame) => {
    if (analysisInFlightRef.current) return;
    analysisInFlightRef.current = true;
    setBusy(true);
    setError(null);
    setPreviewDataUrl(frame.dataUrl);
    try {
      const detail: PredictionDetail = await apiClient.gradeImage(frame.file);
      let thumbnails: Record<number, string> = {};
      try {
        thumbnails = await buildCropThumbnails(frame, detail.detection_boxes);
      } catch {
        thumbnails = {};
      }
      const captureCounts = detail.detection_boxes.reduce(
        (summary, box) => {
          if (box.damage_status === 'Damaged') {
            summary.damaged += 1;
          } else if (box.cleanliness_status === 'Stained') {
            summary.stained += 1;
          } else {
            summary.good += 1;
          }
          return summary;
        },
        { good: 0, stained: 0, damaged: 0 },
      );
      setBatchCounts((current) => ({
        good: current.good + captureCounts.good,
        stained: current.stained + captureCounts.stained,
        damaged: current.damaged + captureCounts.damaged,
      }));
      setResult(detail);
      setCrops(thumbnails);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      analysisInFlightRef.current = false;
      setBusy(false);
      setPreviewDataUrl(null);
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (!busy) fileInputRef.current?.click();
  }, [busy]);

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('Unsupported file. Choose a JPG, PNG, WEBP or BMP image.');
        return;
      }
      try {
        const frame = await fileToFrame(file);
        await analyzeFrame(frame);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [analyzeFrame],
  );

  const handleSampleSelect = useCallback(
    async (imageUrl: string) => {
      if (busy || analysisInFlightRef.current) return;
      try {
        await handleImageFile(await fetchImageFile(imageUrl));
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [busy, handleImageFile],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file) void handleImageFile(file);
    },
    [handleImageFile],
  );

  useEffect(() => {
    const preventBrowserDrop = (event: DragEvent) => {
      event.preventDefault();
    };
    window.addEventListener('dragover', preventBrowserDrop);
    window.addEventListener('drop', preventBrowserDrop);
    return () => {
      window.removeEventListener('dragover', preventBrowserDrop);
      window.removeEventListener('drop', preventBrowserDrop);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isTyping) return;

      if (event.key.toLowerCase() === 'u') {
        handleUpload();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUpload]);

  const exportBatch = useCallback(() => {
    if (!result) return;
    const payload = {
      tray_id: result.tray_id,
      exported_at: new Date().toISOString(),
      prediction: result,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `egg-tray-${result.tray_id.slice(0, 8)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const recordBatch = useCallback(async () => {
    if (!result || recording) return;
    setRecording(true);
    setError(null);
    try {
      await apiClient.recordBatch(result.id, batchCounts);
      setBatchCounts(emptyBatchCounts);
      setResult(null);
      setCrops({});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRecording(false);
    }
  }, [batchCounts, recording, result]);

  return (
    <main className="w-full bg-[#f8fbfe] bg-[radial-gradient(ellipse_90%_70%_at_20%_-10%,rgba(0,102,255,0.09),transparent_60%),radial-gradient(ellipse_80%_60%_at_85%_15%,rgba(39,223,188,0.11),transparent_55%),radial-gradient(ellipse_90%_60%_at_50%_105%,rgba(16,185,129,0.08),transparent_60%),radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.85),rgba(240,246,253,0.95))] min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/15 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -right-36 w-[540px] h-[540px] rounded-full bg-gradient-to-bl from-emerald-300/15 via-teal-200/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-36 left-10 w-[640px] h-[640px] rounded-full bg-gradient-to-tr from-cyan-300/12 to-transparent blur-3xl" />
      </div>

      <div className="relative flex flex-col w-full">
        <div className="p-4 sm:p-gutter-desktop flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full">
          <Navbar />

          <section className="relative flex flex-col gap-space-md overflow-hidden rounded-3xl border border-white/80 bg-white/70 p-space-sm shadow-[0_12px_36px_0_rgba(0,80,203,0.07)] backdrop-blur-2xl sm:p-space-md">
            <SampleImageTray
              busy={busy}
              onSelect={(imageUrl) => void handleSampleSelect(imageUrl)}
            />
            <LiveCameraCapture
              busy={busy}
              onCapture={(file) => void handleImageFile(file)}
            />
            <ImageDropzone
              busy={busy}
              previewDataUrl={previewDataUrl}
              onUpload={handleUpload}
              onDropFile={(file) => void handleImageFile(file)}
              onDropSample={(imageUrl) => void handleSampleSelect(imageUrl)}
            />
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[20px] text-red-600">
                  error
                </span>
                <p className="font-body-md text-body-md text-red-800">{error}</p>
              </div>
            </div>
          )}

          <ResultsPanel
            result={result}
            crops={crops}
            onRecordBatch={() => void recordBatch()}
            recording={recording}
            batchCounts={{
              good: batchCounts.good,
              stained: batchCounts.stained,
              damaged: batchCounts.damaged,
            }}
          />
          <StatusFooter health={health} result={result} onExport={exportBatch} />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />
    </main>
  );
}
