'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { loadPdfjs } from '@/lib/pdf/loader';

export interface UsePdfPreviewOptions {
  initialPage?: number;
  renderScale?: number;
}

export interface UsePdfPreviewReturn {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isLoading: boolean;
  error: string | null;
  renderPageToCanvas: (
    canvas: HTMLCanvasElement | null,
    pageNum: number,
    onAfterRender?: (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      scale: number
    ) => void
  ) => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
}

/**
 * Universal hook for loading PDF document previews and rendering pages to canvas safely.
 */
export function usePdfPreview(
  file: File | null,
  options: UsePdfPreviewOptions = {}
): UsePdfPreviewReturn {
  const { initialPage = 1, renderScale = 1.5 } = options;

  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reference to loaded PDFDocumentProxy
  const pdfDocRef = useRef<any>(null);
  // Reference to current render task to cancel if user rapidly changes pages
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  // Load PDF file when file changes
  useEffect(() => {
    if (!file) {
      pdfDocRef.current = null;
      setTotalPages(0);
      setCurrentPage(1);
      setError(null);
      return;
    }

    let isSubscribed = true;

    async function loadDocument() {
      setIsLoading(true);
      setError(null);

      try {
        const pdfjsLib = await loadPdfjs();
        const arrayBuffer = await file!.arrayBuffer();

        if (!isSubscribed) return;

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (!isSubscribed) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage((prev) => (prev > pdf.numPages || prev < 1 ? 1 : prev));
      } catch (err: unknown) {
        if (!isSubscribed) return;
        const msg = err instanceof Error ? err.message : 'Failed to load PDF preview';
        setError(msg);
        console.error('Failed to load PDF for preview:', err);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isSubscribed = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancel error
        }
        renderTaskRef.current = null;
      }
    };
  }, [file]);

  const renderPageToCanvas = useCallback(
    async (
      canvas: HTMLCanvasElement | null,
      pageNum: number,
      onAfterRender?: (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        scale: number
      ) => void
    ) => {
      if (!canvas || !pdfDocRef.current) return;

      // Cancel previous rendering task if running
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDocRef.current.getPage(pageNum);
        const viewport = page.getViewport({ scale: renderScale });
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;

        if (onAfterRender) {
          onAfterRender(ctx, viewport.width, viewport.height, renderScale);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('cancelled')) {
          return;
        }
        console.error('Failed to render page to canvas:', err);
      }
    },
    [renderScale]
  );

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  return {
    totalPages,
    currentPage,
    setCurrentPage,
    isLoading,
    error,
    renderPageToCanvas,
    nextPage,
    prevPage,
  };
}
