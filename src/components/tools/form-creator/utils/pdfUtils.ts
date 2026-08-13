// Store pdfjs module reference
let pdfjsModule: typeof import('pdfjs-dist') | null = null;

// Load pdfjs module dynamically
export const loadPdfjsLib = async () => {
  if (pdfjsModule) return pdfjsModule;

  const pdfjsLib = await import('pdfjs-dist');
  const { configurePdfjsWorker } = await import('@/lib/pdf/loader');

  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    configurePdfjsWorker(pdfjsLib);
  }

  pdfjsModule = pdfjsLib;
  return pdfjsLib;
};
