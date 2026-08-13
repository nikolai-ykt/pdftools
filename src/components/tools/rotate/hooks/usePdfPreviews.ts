'use client';

import { useState, useCallback, useRef } from 'react';
import { configurePdfjsWorker } from '@/lib/pdf/loader';
import type { PagePreview } from '../types';

const MAX_PREVIEW_PAGES = 50;
const PREVIEW_SCALE = 0.15;
const PREVIEW_QUALITY = 0.6;
const CONCURRENCY_LIMIT = 4;

interface RenderPagePreviewOptions {
  pdf: any;
  pageNumber: number;
  scale?: number;
  quality?: number;
}

/**
 * Render thumbnail for a single PDF page
 */
async function renderPagePreview({
  pdf,
  pageNumber,
  scale = PREVIEW_SCALE,
  quality = PREVIEW_QUALITY,
}: RenderPagePreviewOptions): Promise<PagePreview> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (context) {
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return {
      pageNumber,
      thumbnail: canvas.toDataURL('image/jpeg', quality),
      rotation: 0,
    };
  }

  return { pageNumber, rotation: 0 };
}

export function usePdfPreviews() {
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const resetPreviews = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPagePreviews([]);
    setIsLoadingPreviews(false);
    setTotalPages(0);
    setError(null);
  }, []);

  const loadPdfPreviews = useCallback(async (pdfFile: File) => {
    // Abort any ongoing preview load
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingPreviews(true);
    setPagePreviews([]);
    setError(null);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      configurePdfjsWorker(pdfjsLib);

      const arrayBuffer = await pdfFile.arrayBuffer();
      if (controller.signal.aborted) return;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      if (controller.signal.aborted) return;

      const numPages = pdf.numPages;
      setTotalPages(numPages);

      const maxPreviewPages = Math.min(numPages, MAX_PREVIEW_PAGES);
      const previews: PagePreview[] = new Array(numPages);

      // Process thumbnail pages in concurrent batches
      for (let i = 1; i <= maxPreviewPages; i += CONCURRENCY_LIMIT) {
        if (controller.signal.aborted) return;

        const batchIndices: number[] = [];
        for (let j = i; j < Math.min(i + CONCURRENCY_LIMIT, maxPreviewPages + 1); j++) {
          batchIndices.push(j);
        }

        const batchResults = await Promise.all(
          batchIndices.map(pageNum => renderPagePreview({ pdf, pageNumber: pageNum }))
        );

        if (controller.signal.aborted) return;

        batchResults.forEach(res => {
          previews[res.pageNumber - 1] = res;
        });
      }

      // Fill remaining pages with placeholder rotation objects without thumbnails
      for (let i = maxPreviewPages + 1; i <= numPages; i++) {
        previews[i - 1] = { pageNumber: i, rotation: 0 };
      }

      if (!controller.signal.aborted) {
        setPagePreviews(previews);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error('Failed to load PDF previews:', err);
        setError('Failed to load PDF preview. The file may be corrupted or encrypted.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingPreviews(false);
      }
    }
  }, []);

  return {
    pagePreviews,
    setPagePreviews,
    isLoadingPreviews,
    totalPages,
    previewError: error,
    setPreviewError: setError,
    loadPdfPreviews,
    resetPreviews,
  };
}
