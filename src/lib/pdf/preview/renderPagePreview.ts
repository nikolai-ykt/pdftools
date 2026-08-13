import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PagePreview } from '@/components/tools/organize/types';

/**
 * Renders a single PDF page to a canvas and returns a Blob Object URL thumbnail.
 */
export async function renderPagePreview(
  pdf: PDFDocumentProxy,
  pageNumber: number
): Promise<PagePreview> {
  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.3 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return { pageNumber };
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.7);
    });

    if (!blob) {
      return { pageNumber };
    }

    return {
      pageNumber,
      thumbnail: URL.createObjectURL(blob),
    };
  } catch (error) {
    console.error(`Failed to render preview for page ${pageNumber}:`, error);
    return { pageNumber };
  }
}

/**
 * Renders previews in concurrent batches to balance CPU load and speed.
 */
export async function generatePagePreviewsBatch(
  pdf: PDFDocumentProxy,
  totalPages: number,
  concurrency = 4,
  onProgress?: (loadedCount: number, totalCount: number) => void
): Promise<PagePreview[]> {
  const maxPreviewPages = Math.min(totalPages, 100);
  const pageNumbers = Array.from({ length: maxPreviewPages }, (_, i) => i + 1);
  const previews: PagePreview[] = [];

  for (let i = 0; i < pageNumbers.length; i += concurrency) {
    const batch = pageNumbers.slice(i, i + concurrency);
    const batchPreviews = await Promise.all(
      batch.map((pageNum) => renderPagePreview(pdf, pageNum))
    );
    previews.push(...batchPreviews);
    if (onProgress) {
      onProgress(previews.length, maxPreviewPages);
    }
  }

  for (let i = maxPreviewPages + 1; i <= totalPages; i++) {
    previews.push({ pageNumber: i });
  }

  return previews;
}
