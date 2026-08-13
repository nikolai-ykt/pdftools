import { useState, useMemo, useRef, useCallback } from 'react';
import { splitPDF, type BookmarkInfo } from '@/lib/pdf';
import type { SplitOptions, ProcessOutput, PageRange } from '@/types/pdf';
import type { ProcessingStatus } from '../../ProcessingProgress';
import { calculateSplitRanges, type SplitMode } from '../utils/calculateSplitRanges';

export interface UsePdfSplitterProps {
  file: File | null;
  splitMode: SplitMode;
  totalPages: number;
  selectedPages: Set<number>;
  rangeInput: string;
  splitCount: number;
  evenOddMode: 'odd' | 'even' | 'both';
  bookmarks: BookmarkInfo[];
}

export interface SplitResultItem {
  blob: Blob;
  filename: string;
}

export interface UsePdfSplitterReturn {
  status: ProcessingStatus;
  progress: number;
  progressMessage: string;
  results: SplitResultItem[];
  error: string | null;
  pageRanges: PageRange[];
  canSplit: boolean;
  isProcessing: boolean;
  split: () => Promise<void>;
  cancel: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export function usePdfSplitter({
  file,
  splitMode,
  totalPages,
  selectedPages,
  rangeInput,
  splitCount,
  evenOddMode,
  bookmarks,
}: UsePdfSplitterProps): UsePdfSplitterReturn {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [results, setResults] = useState<SplitResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef<boolean>(false);

  // Pure derived state for page ranges
  const pageRanges = useMemo(() => {
    return calculateSplitRanges({
      splitMode,
      rangeInput,
      selectedPages,
      totalPages,
      splitCount,
      evenOddMode,
      pdfBookmarks: bookmarks,
    });
  }, [
    splitMode,
    rangeInput,
    selectedPages,
    totalPages,
    splitCount,
    evenOddMode,
    bookmarks,
  ]);

  const isProcessing = status === 'processing' || status === 'uploading';

  // Simplified canSplit logic
  const canSplit = Boolean(
    file && totalPages > 0 && !isProcessing && pageRanges.length > 0
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
    setResults([]);
    setError(null);
    cancelledRef.current = false;
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setStatus('idle');
    setProgress(0);
  }, []);

  const split = useCallback(async () => {
    if (!file) {
      setError('Please upload a PDF file first.');
      return;
    }

    if (pageRanges.length === 0) {
      setError('Please specify page ranges or select pages to extract.');
      return;
    }

    cancelledRef.current = false;
    setStatus('processing');
    setProgress(0);
    setError(null);
    setResults([]);

    const options: SplitOptions = {
      ranges: pageRanges,
      outputFormat: 'multiple',
    };

    try {
      const output: ProcessOutput = await splitPDF(
        file,
        options,
        (prog, message) => {
          if (!cancelledRef.current) {
            setProgress(prog);
            setProgressMessage(message || '');
          }
        }
      );

      if (cancelledRef.current) {
        setStatus('idle');
        return;
      }

      if (output.success && output.result) {
        const blobs = Array.isArray(output.result) ? output.result : [output.result];
        const filenames = (output.metadata?.outputFiles as string[]) ||
          blobs.map((_, i) => `split_${i + 1}.pdf`);

        const resultFiles: SplitResultItem[] = blobs.map((blob, i) => ({
          blob,
          filename: filenames[i] || `split_${i + 1}.pdf`,
        }));

        setResults(resultFiles);
        setStatus('complete');
      } else {
        setError(output.error?.message || 'Failed to split PDF file.');
        setStatus('error');
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        setStatus('error');
      }
    }
  }, [file, pageRanges]);

  return {
    status,
    progress,
    progressMessage,
    results,
    error,
    pageRanges,
    canSplit,
    isProcessing,
    split,
    cancel,
    setError,
    reset,
  };
}
