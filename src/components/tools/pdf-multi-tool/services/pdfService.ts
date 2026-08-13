import { configurePdfjsWorker } from '@/lib/pdf/loader';
import type { PdfPage, PdfSource } from '../types';

export interface LoadPreviewsResult {
  source: PdfSource;
  pages: PdfPage[];
  thumbnails: Map<string, string>;
}

/**
 * Load PDF file and generate metadata and thumbnail previews
 */
export async function loadPdfPreviews(
  file: File,
  maxPreviewsToRender = 50
): Promise<LoadPreviewsResult> {
  const pdfjsLib = await import('pdfjs-dist');
  configurePdfjsWorker(pdfjsLib);

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const sourceId = crypto.randomUUID();
  const source: PdfSource = {
    id: sourceId,
    file,
    name: file.name,
    pageCount: pdf.numPages,
  };

  const pages: PdfPage[] = [];
  const thumbnails = new Map<string, string>();

  // Create page objects metadata
  for (let i = 1; i <= pdf.numPages; i++) {
    const pageId = crypto.randomUUID();
    pages.push({
      id: pageId,
      sourceFileId: sourceId,
      originalPageNumber: i,
      rotation: 0,
      isBlank: false,
    });
  }

  // Render thumbnails for up to maxPreviewsToRender
  const pagesToRender = Math.min(pdf.numPages, maxPreviewsToRender);
  for (let i = 0; i < pagesToRender; i++) {
    try {
      const pageNum = i + 1;
      const page = await pdf.getPage(pageNum);

      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        thumbnails.set(pages[i].id, thumbnail);
      }
    } catch (err) {
      console.warn(`Failed to render thumbnail for page ${i + 1}:`, err);
    }
  }

  return { source, pages, thumbnails };
}

export interface BuildPdfOptions {
  pages: PdfPage[];
  sources: PdfSource[];
  onProgress?: (progress: number, message: string) => void;
  isCancelled?: () => boolean;
}

/**
 * Unified PDF document builder using pdf-lib
 */
export async function buildPdfDocument(options: BuildPdfOptions): Promise<Blob> {
  const { pages, sources, onProgress, isCancelled } = options;

  if (pages.length === 0) {
    throw new Error('No pages to process');
  }

  const pdfLib = await import('pdf-lib');
  const newPdf = await pdfLib.PDFDocument.create();

  // Map source file ID -> loaded pdf-lib PDFDocument
  const loadedPdfsMap = new Map<string, typeof pdfLib.PDFDocument.prototype>();

  const total = pages.length;

  for (let i = 0; i < pages.length; i++) {
    if (isCancelled && isCancelled()) {
      throw new Error('Cancelled');
    }

    const pageInfo = pages[i];
    const percent = Math.round(((i + 1) / total) * 90);
    onProgress?.(percent, `Processing page ${i + 1} of ${total}...`);

    if (pageInfo.isBlank) {
      // Add a blank A4 page (595.28 x 841.89 points)
      newPdf.addPage([595.28, 841.89]);
    } else if (pageInfo.sourceFileId && pageInfo.originalPageNumber) {
      let sourcePdf = loadedPdfsMap.get(pageInfo.sourceFileId);

      if (!sourcePdf) {
        const sourceObj = sources.find(s => s.id === pageInfo.sourceFileId);
        if (!sourceObj) {
          throw new Error(`Source file not found for page ${i + 1}`);
        }
        const arrayBuffer = await sourceObj.file.arrayBuffer();
        sourcePdf = await pdfLib.PDFDocument.load(arrayBuffer);
        loadedPdfsMap.set(pageInfo.sourceFileId, sourcePdf);
      }

      // Copy page (0-indexed in pdf-lib)
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [
        pageInfo.originalPageNumber - 1,
      ]);

      if (pageInfo.rotation !== 0) {
        const currentRotation = copiedPage.getRotation().angle;
        copiedPage.setRotation(
          pdfLib.degrees((currentRotation + pageInfo.rotation) % 360)
        );
      }

      newPdf.addPage(copiedPage);
    }
  }

  if (isCancelled && isCancelled()) {
    throw new Error('Cancelled');
  }

  onProgress?.(95, 'Finalizing PDF file...');
  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}
