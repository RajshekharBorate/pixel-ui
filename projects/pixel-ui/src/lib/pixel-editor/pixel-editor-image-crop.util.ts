/**
 * Canvas-crop a source image URL/file to a JPEG blob (recommended crop path).
 */
export async function cropImageToBlob(
  source: string | File,
  crop: { x: number; y: number; width: number; height: number },
  quality = 0.92,
): Promise<Blob> {
  const bitmap =
    typeof source === 'string'
      ? await createImageBitmap(await (await fetch(source)).blob())
      : await createImageBitmap(source);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas 2D unavailable');
  }
  ctx.drawImage(
    bitmap,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Crop encode failed'))),
      'image/jpeg',
      quality,
    );
  });
}
