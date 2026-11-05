import { DragEvent, useEffect, useState } from 'react';

interface SampleImageTrayProps {
  busy: boolean;
}

const SAMPLE_IMAGE_PATH = '/egg-images/';

export function SampleImageTray({ busy }: SampleImageTrayProps) {
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
    <section className="rounded-2xl border border-blue-100/80 bg-white/60 p-space-sm shadow-sm">
      <div className="mb-space-sm flex items-center justify-between gap-space-sm">
        <div>
          <h2 className="font-headline-md text-headline-md font-semibold text-[#181c1f]">
            Test Images
          </h2>
          <p className="font-body-md text-body-md text-[#525b6a]">
            Drag an image onto the camera section to analyze it.
          </p>
        </div>
        <span className="font-code-metric text-label-sm text-[#0066ff]">
          {images.length} AVAILABLE
        </span>
      </div>
      <div className="flex gap-space-sm overflow-x-auto pb-1">
        {images.map((filename) => {
          const imageUrl = `${SAMPLE_IMAGE_PATH}${encodeURIComponent(filename)}`;
          return (
            <img
              key={filename}
              src={imageUrl}
              alt={filename}
              draggable={!busy}
              onDragStart={(event) => handleDragStart(event, imageUrl)}
              className={`h-24 w-32 shrink-0 rounded-xl border border-blue-100 object-cover shadow-sm transition ${
                busy
                  ? 'cursor-wait opacity-60'
                  : 'cursor-grab hover:border-[#0066ff] hover:shadow-md active:cursor-grabbing'
              }`}
              title={`Drag ${filename} to the camera`}
            />
          );
        })}
      </div>
    </section>
  );
}
