import { DragEvent, useEffect, useState } from 'react';

interface SampleImageTrayProps {
  busy: boolean;
  onSelect: (imageUrl: string) => void;
}

const SAMPLE_IMAGE_PATH = '/egg-images/';

export function SampleImageTray({ busy, onSelect }: SampleImageTrayProps) {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void fetch(`${SAMPLE_IMAGE_PATH}manifest.json`)
      .then((response) => {
        if (!response.ok) throw new Error('Sample image manifest unavailable');
        return response.json() as Promise<unknown>;
      })
      .then((value) => {
        if (!active || !Array.isArray(value)) return;
        setImages(
          value.filter(
            (filename): filename is string =>
              typeof filename === 'string' &&
              /\.(jpe?g|png|webp|bmp)$/i.test(filename),
          ),
        );
      })
      .catch(() => {
        if (active) setImages([]);
      });

    return () => {
      active = false;
    };
  }, []);

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-blue-200/80 bg-white/55 px-space-md py-space-sm text-center">
        <p className="font-body-md text-body-md text-[#525b6a]">
          Add egg images to <code>frontend/public/egg-images</code> and list
          their filenames in <code>manifest.json</code>.
        </p>
      </div>
    );
  }

  const handleDragStart = (
    event: DragEvent<HTMLImageElement>,
    imageUrl: string,
  ) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/egg-cv-sample', imageUrl);
  };

  return (
    <section className="rounded-2xl border border-blue-100/80 bg-white/60 p-space-sm shadow-sm sm:p-space-md">
      <div className="mb-space-sm flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-headline-md text-headline-md font-semibold text-[#181c1f]">
            Test Images
          </h2>
          <p className="font-body-sm text-body-sm text-[#525b6a] sm:text-body-md">
            Drag onto the drop zone or tap an image to inspect it.
          </p>
        </div>
        <span className="font-code-metric text-label-sm text-[#0066ff]">
          {images.length} AVAILABLE
        </span>
      </div>
      <div className="flex snap-x gap-2 overflow-x-auto pb-1 sm:gap-space-sm">
        {images.map((filename) => {
          const imageUrl = `${SAMPLE_IMAGE_PATH}${encodeURIComponent(filename)}`;
          return (
            <button
              key={filename}
              type="button"
              disabled={busy}
              onClick={() => onSelect(imageUrl)}
              className="group relative shrink-0 snap-start rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066ff] focus-visible:ring-offset-2 disabled:cursor-wait"
              title={`Analyze ${filename}`}
            >
              <img
                key={filename}
                src={imageUrl}
                alt={filename}
                draggable={!busy}
                onDragStart={(event) => handleDragStart(event, imageUrl)}
                className={`h-20 w-28 rounded-xl border border-blue-100 object-cover shadow-sm transition sm:h-24 sm:w-32 ${
                  busy
                    ? 'opacity-60'
                    : 'cursor-grab hover:border-[#0066ff] hover:shadow-md active:cursor-grabbing'
                }`}
                title={`Drag ${filename} to the drop zone`}
              />
              <span className="pointer-events-none absolute inset-x-1 bottom-1 rounded-md bg-black/60 px-1.5 py-0.5 text-center font-code-metric text-[9px] font-bold tracking-wide text-white sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                TAP TO INSPECT
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
