import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { configurePdfjsWorker } from '@/lib/pdf/loader';
import { generatePagePreviewsBatch } from '@/lib/pdf/preview/renderPagePreview';
import type { PagePreview } from '../types';

export function usePdfPreviews() {
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadIdRef = useRef(0);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const previewsRef = useRef<PagePreview[]>([]);

  // Cleanup helper for Blob URLs
  const revokeThumbnailUrls = useCallback((previews: PagePreview[]) => {
    previews.forEach((p) => {
      if (p.thumbnail && p.thumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(p.thumbnail);
      }
    });
  }, []);

  // Cleanup PDF document and previews on unmount
  useEffect(() => {
    return () => {
      revokeThumbnailUrls(previewsRef.current);
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [revokeThumbnailUrls]);

  const loadPdfPreviews = useCallback(
    async (pdfFile: File): Promise<number> => {
      const loadId = ++loadIdRef.current;
      setIsLoadingPreviews(true);
      setPreviewError(null);

      // Clean previous resources
      revokeThumbnailUrls(previewsRef.current);
      previewsRef.current = [];
      setPagePreviews([]);

      if (pdfDocRef.current) {
        await pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }

      try {
        const pdfjsLib = await import('pdfjs-dist');
        configurePdfjsWorker(pdfjsLib);

        const arrayBuffer = await pdfFile.arrayBuffer();

        if (loadId !== loadIdRef.current) {
          return 0;
        }

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (loadId !== loadIdRef.current) {
          await pdf.destroy();
          return 0;
        }

        pdfDocRef.current = pdf;

        const previews = await generatePagePreviewsBatch(pdf, pdf.numPages, 4);

        if (loadId !== loadIdRef.current) {
          revokeThumbnailUrls(previews);
          await pdf.destroy();
          return 0;
        }

        previewsRef.current = previews;
        setPagePreviews(previews);
        return pdf.numPages;
      } catch (err) {
        if (loadId === loadIdRef.current) {
          console.error('Failed to load PDF previews:', err);
          setPreviewError(
            'Failed to load PDF preview. The file may be corrupted or encrypted.'
          );
        }
        return 0;
      } finally {
        if (loadId === loadIdRef.current) {
          setIsLoadingPreviews(false);
        }
      }
    },
    [revokeThumbnailUrls]
  );

  const clearPreviews = useCallback(() => {
    revokeThumbnailUrls(previewsRef.current);
    previewsRef.current = [];
    setPagePreviews([]);
    setPreviewError(null);
    setIsLoadingPreviews(false);
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }
  }, [revokeThumbnailUrls]);

  // Efficient Map lookup for page previews
  const previewsByPage = useMemo(() => {
    return new Map(pagePreviews.map((p) => [p.pageNumber, p]));
  }, [pagePreviews]);

  const getPreviewForPage = useCallback(
    (pageNum: number): PagePreview | undefined => {
      return previewsByPage.get(pageNum);
    },
    [previewsByPage]
  );

  return {
    pagePreviews,
    isLoadingPreviews,
    previewError,
    loadPdfPreviews,
    clearPreviews,
    getPreviewForPage,
  };
}
