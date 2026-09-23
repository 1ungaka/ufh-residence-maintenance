/**
 * Shrinks a photo in the browser before upload, so a 6 MB phone picture
 * becomes a ~300 KB JPEG. Workers only need to see the fault, not print it.
 */
const MAX_INPUT_BYTES = 25 * 1024 * 1024; // refuse anything bigger than this outright
const TARGET_BYTES = 1.5 * 1024 * 1024;   // keep uploads comfortably under the 2 MB bucket limit
const MAX_EDGE = 1600;                    // longest side in pixels

export class PhotoError extends Error {}

function loadImage(file) {
  // createImageBitmap applies the phone's EXIF rotation, so photos aren't sideways.
  if ('createImageBitmap' in window) {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function toJpeg(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function compressPhoto(file) {
  if (!file.type.startsWith('image/')) {
    throw new PhotoError('That file is not a photo. Choose a JPG, PNG or WebP image.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new PhotoError('That photo is too large (over 25 MB). Choose a smaller one.');
  }

  let image;
  try {
    image = await loadImage(file);
  } catch {
    // Most often an iPhone HEIC photo, which browsers other than Safari cannot open.
    throw new PhotoError(
      'This photo format is not supported. Use a JPG or PNG. On iPhone: Settings, Camera, Formats, Most Compatible.'
    );
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // transparent PNGs would otherwise turn black as JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close?.();

  let blob = null;
  for (const quality of [0.82, 0.7, 0.55]) {
    blob = await toJpeg(canvas, quality);
    if (blob && blob.size <= TARGET_BYTES) break;
  }
  if (!blob) throw new PhotoError('Could not process that photo. Try a different one.');

  return new File([blob], 'fault-photo.jpg', { type: 'image/jpeg' });
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
