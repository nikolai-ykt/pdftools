/**
 * Helper utilities for image conversion and caching in PDF processors
 */

// Cache converted ArrayBuffers by File instance
const imageCache = new WeakMap<File, ArrayBuffer>();

/**
 * Convert any image file (JPEG, PNG, etc.) to PNG ArrayBuffer format using Canvas.
 * Correctly revokes the object URL only after canvas conversion completes.
 */
export async function convertImageToPng(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error('Failed to convert image to PNG'));
            return;
          }

          try {
            const buffer = await blob.arrayBuffer();
            resolve(buffer);
          } catch (err) {
            reject(err);
          }
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get image PNG ArrayBuffer with weak caching for identical File reference
 */
export async function getImageData(file: File): Promise<ArrayBuffer> {
  const cached = imageCache.get(file);
  if (cached) {
    return cached;
  }

  const data = await convertImageToPng(file);
  imageCache.set(file, data);
  return data;
}
