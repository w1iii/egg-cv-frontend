import { useCallback, useEffect, useRef, useState } from 'react';

interface LiveCameraCaptureProps {
  busy: boolean;
  onCapture: (file: File) => void;
}

function captureVideoFrame(video: HTMLVideoElement): Promise<File> {
  const { videoWidth, videoHeight } = video;
  if (!videoWidth || !videoHeight) {
    return Promise.reject(new Error('Camera is not ready yet.'));
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('Could not capture camera frame.'));
  context.drawImage(video, 0, 0, videoWidth, videoHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not create image from camera frame.'));
        return;
      }
      resolve(new File([blob], `egg-tray-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.95);
  });
}

export function LiveCameraCapture({ busy, onCapture }: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is unavailable. Use HTTPS or localhost, or upload an image instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCameraError('Camera permission was denied. Allow camera access in browser settings, or upload an image.');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setCameraError('No compatible camera was found. Connect a camera or upload an image.');
      } else {
        setCameraError('Could not start camera. Check that it is connected and not being used by another app.');
      }
    }
  }, []);

  const capture = useCallback(async () => {
    if (!cameraActive || busy || !videoRef.current) return;
    setCameraError(null);
    try {
      onCapture(await captureVideoFrame(videoRef.current));
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Could not capture camera frame.');
    }
  }, [busy, cameraActive, onCapture]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || !cameraActive || busy) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'BUTTON' ||
        target?.isContentEditable
      ) return;
      event.preventDefault();
      void capture();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, cameraActive, capture]);

  useEffect(() => stopCamera, [stopCamera]);

  return (
    <section className="rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-sm sm:p-5" aria-label="Live camera inspection">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-lg text-[#181c1f]">Live camera</h2>
          <p className="font-body-md text-sm text-[#525b6a]">Position the egg tray in view, then press Space or Capture.</p>
        </div>
        <div className="flex gap-2">
          {cameraActive ? (
            <>
              <button type="button" onClick={stopCamera} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Stop camera</button>
              <button type="button" onClick={() => void capture()} disabled={busy} className="rounded-xl bg-[#0066ff] px-4 py-2 font-semibold text-white hover:bg-[#0050cb] disabled:cursor-wait disabled:opacity-60">{busy ? 'Analyzing…' : 'Capture'}</button>
            </>
          ) : (
            <button type="button" onClick={() => void startCamera()} disabled={busy} className="rounded-xl bg-[#0066ff] px-4 py-2 font-semibold text-white hover:bg-[#0050cb] disabled:opacity-60">Start camera</button>
          )}
        </div>
      </div>

      <div className="relative aspect-video min-h-[220px] overflow-hidden rounded-xl bg-slate-950 sm:min-h-[300px]">
        <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full object-contain ${cameraActive ? '' : 'hidden'}`} aria-label="Live camera preview" />
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-white">
            <span className="material-symbols-outlined text-4xl">videocam</span>
            <p className="font-body-md text-sm">Start camera to preview the egg tray.</p>
          </div>
        )}
        {busy && cameraActive && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-white"><span className="rounded-full bg-black/60 px-4 py-2 font-semibold">Analyzing captured frame…</span></div>}
      </div>

      {cameraError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{cameraError}</p>}
      {cameraActive && <p className="mt-2 text-xs text-slate-500">Camera is active. Press Space to capture. Browser camera access requires HTTPS or localhost.</p>}
    </section>
  );
}
