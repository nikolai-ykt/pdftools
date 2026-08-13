import { useState, useCallback, useRef } from 'react';
import type { PdfPage, PdfSource, ProcessingStatus } from '../types';
import { buildPdfDocument } from '../services/pdfService';
import { downloadBlob } from '../utils/download';

interface UsePdfExportOptions {
  pages: PdfPage[];
  sources: PdfSource[];
  selectedIds: Set<string>;
}

export function usePdfExport({ pages, sources, selectedIds }: UsePdfExportOptions) {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
  }, []);

  const exportPdf = useCallback(async () => {
    if (pages.length === 0) {
      setError('NO_PAGES');
      return;
    }

    cancelledRef.current = false;
    setStatus('processing');
    setProgress(0);
    setProgressMessage('Preparing PDF export...');
    setError(null);
    setResult(null);

    try {
      const blob = await buildPdfDocument({
        pages,
        sources,
        onProgress: (p, msg) => {
          setProgress(p);
          setProgressMessage(msg);
        },
        isCancelled: () => cancelledRef.current,
      });

      if (cancelledRef.current) return;

      setResult(blob);
      setStatus('complete');
      setProgress(100);
    } catch (err: any) {
      if (err?.message === 'Cancelled' || cancelledRef.current) {
        return;
      }
      console.error('Failed to export PDF:', err);
      setError('EXPORT_FAILED');
      setStatus('error');
    }
  }, [pages, sources]);

  const downloadSelected = useCallback(async () => {
    if (selectedIds.size === 0) {
      setError('NO_SELECTED_PAGES');
      return;
    }

    cancelledRef.current = false;
    setStatus('processing');
    setProgress(0);
    setProgressMessage('Preparing selected pages for download...');
    setError(null);

    try {
      const selectedPages = pages.filter(p => selectedIds.has(p.id));
      const blob = await buildPdfDocument({
        pages: selectedPages,
        sources,
        onProgress: (p, msg) => {
          setProgress(p);
          setProgressMessage(msg);
        },
        isCancelled: () => cancelledRef.current,
      });

      if (cancelledRef.current) return;

      downloadBlob(blob, 'selected_pages.pdf');
      setStatus('idle');
      setProgress(0);
    } catch (err: any) {
      if (err?.message === 'Cancelled' || cancelledRef.current) {
        return;
      }
      console.error('Failed to download selected pages:', err);
      setError('DOWNLOAD_FAILED');
      setStatus('error');
    }
  }, [pages, selectedIds, sources]);

  return {
    status,
    progress,
    progressMessage,
    result,
    error,
    setError,
    exportPdf,
    downloadSelected,
    handleCancel,
  };
}
