import { DragEvent, KeyboardEvent, useRef, useState } from 'react';

interface ImageDropzoneProps {
  busy: boolean;
  previewDataUrl: string | null;
  onUpload: () => void;
  onDropFile: (file: File) => void;
  onDropSample: (url: string) => void;
}

const IMAGE_TYPE = /^image\//;

export function ImageDropzone({
  busy,
  previewDataUrl,
  onUpload,
  onDropFile,
  onDropSample,
}: ImageDropzoneProps) {
  const [dropActive, setDropActive] = useState(false);
  const dragDepth = useRef(0);

  const setDragging = (active: boolean) => {
    if (!busy) setDropActive(active);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!busy) event.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDropActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDropActive(false);
    if (busy) return;

    const sampleUrl = event.dataTransfer.getData('text/egg-cv-sample');
    if (sampleUrl) {
      onDropSample(sampleUrl);
      return;
    }

    const file = Array.from(event.dataTransfer.files).find((item) =>
      IMAGE_TYPE.test(item.type),
    );
    if (file) onDropFile(file);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!busy) onUpload();
    }
  };

  return (
    <div
      className={`relative flex w-full min-h-[260px] sm:min-h-[320px] lg:min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors select-none sm:px-8 ${
        dropActive
          ? 'border-[#0066ff] bg-blue-100/80'
          : 'border-blue-200 bg-gradient-to-b from-white/80 to-blue-50/60 hover:border-blue-300'
      } ${busy ? 'cursor-wait' : 'cursor-pointer'}`}
      role="button"
      tabIndex={0}
      aria-label="Drag and drop an egg tray image here, or browse to upload"
      aria-busy={busy}
      onClick={() => {
        if (!busy) onUpload();
      }}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#0066ff]/70 pointer-events-none sm:top-5 sm:left-5 sm:w-7 sm:h-7" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#0066ff]/70 pointer-events-none sm:top-5 sm:right-5 sm:w-7 sm:h-7" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#0066ff]/70 pointer-events-none sm:bottom-5 sm:left-5 sm:w-7 sm:h-7" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#0066ff]/70 pointer-events-none sm:bottom-5 sm:right-5 sm:w-7 sm:h-7" />

      {previewDataUrl && busy ? (
        <div className="absolute inset-0 z-20">
          <img
            src={previewDataUrl}
            alt="Uploaded tray being analyzed"
            className="h-full w-full bg-slate-950/90 object-contain"
          />
          <div className="absolute inset-0 bg-blue-950/35" />
          <div className="absolute inset-x-0 top-0 h-20 scanline bg-gradient-to-b from-[#27dfbc]/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-white">
            <span className="material-symbols-outlined text-[34px] animate-pulse sm:text-[42px]">
              center_focus_strong
            </span>
            <div className="rounded-full bg-black/60 px-4 py-2 backdrop-blur-md">
              <span className="font-code-metric text-label-sm font-bold tracking-wide text-white sm:text-label-lg">
                ANALYZING IMAGE...
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500 to-[#0050cb] text-white shadow-[0_8px_20px_rgba(0,102,255,0.28)] sm:h-16 sm:w-16">
            <span className="material-symbols-outlined text-[28px] sm:text-[32px]">
              add_photo_alternate
            </span>
          </div>
          <div className="max-w-md">
            <h3 className="font-headline-lg text-xl tracking-tight text-[#181c1f] sm:text-headline-lg">
              Drag images here
            </h3>
            <p className="mt-1 font-body-md text-body-sm text-[#525b6a] sm:text-body-md">
              Drop an egg tray photo to run automated inspection, or choose a
              file from your device.
            </p>
          </div>
          <span className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0066ff] to-[#0050cb] px-5 py-2.5 font-headline-md text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,102,255,0.3)]">
            <span className="material-symbols-outlined text-[20px]">
              upload
            </span>
            Choose Image
          </span>
          <span className="font-code-metric text-label-sm text-[#727687]">
            JPG · PNG · WEBP · BMP
          </span>
        </div>
      )}

      {dropActive && !busy && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-blue-600/10 px-4 backdrop-blur-[1px]">
          <span className="material-symbols-outlined text-[40px] text-[#0050cb] sm:text-[48px]">
            download
          </span>
          <span className="rounded-full bg-white px-4 py-2 font-headline-md text-sm font-semibold text-[#0050cb] shadow-lg sm:text-headline-md">
            Release to analyze image
          </span>
        </div>
      )}
    </div>
  );
}
