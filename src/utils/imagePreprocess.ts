import { PreprocessOptions } from '../types';

export function processImageOnCanvas(
  imgElement: HTMLImageElement,
  options: PreprocessOptions
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(imgElement.src);
      return;
    }

    canvas.width = imgElement.naturalWidth || imgElement.width || 700;
    canvas.height = imgElement.naturalHeight || imgElement.height || 920;

    // Draw base image
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    if (!options.denoise && !options.contrastEnhancement && !options.binarization) {
      resolve(canvas.toDataURL('image/png'));
      return;
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const len = data.length;

    // 1. Grayscale & Contrast Enhancement
    const contrastFactor = options.contrastEnhancement ? 1.45 : 1.0;
    const intercept = 128 * (1 - contrastFactor);

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Luminance
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (options.contrastEnhancement) {
        gray = gray * contrastFactor + intercept;
        gray = Math.max(0, Math.min(255, gray));
      }

      if (options.binarization) {
        // High-contrast binarization for OCR edge separation
        gray = gray > 145 ? 255 : 15;
      }

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imgData, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  });
}
