import { CapturedFrame, DetectionBox } from '../types';

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode the image.'));
    image.src = src;
  });
}

export async function fileToFrame(file: File): Promise<CapturedFrame> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  return {
    file,
    dataUrl,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

export async function fetchImageFile(url: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not load the sample image. Try again.');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('The selected sample is not an image.');
  }

  const filename = decodeURIComponent(url.split('/').pop() ?? 'egg-sample');
  return new File([blob], filename, { type: blob.type });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function buildCropThumbnails(
  frame: CapturedFrame,
  boxes: DetectionBox[],
): Promise<Record<number, string>> {
  if (boxes.length === 0) return {};

  const image = await loadImage(frame.dataUrl);
  return boxes.reduce<Record<number, string>>((crops, box) => {
    const x = clamp(box.x1, 0, frame.width);
    const y = clamp(box.y1, 0, frame.height);
    const right = clamp(box.x2, 0, frame.width);
    const bottom = clamp(box.y2, 0, frame.height);
    const width = right - x;
    const height = bottom - y;
    if (width < 2 || height < 2) return crops;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return crops;

    context.drawImage(image, x, y, width, height, 0, 0, width, height);
    crops[box.id] = canvas.toDataURL('image/jpeg', 0.9);
    return crops;
  }, {});
}
