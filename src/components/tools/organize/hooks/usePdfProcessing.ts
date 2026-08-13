import { useState, useCallback, useRef } from 'react';
import type { ProcessingStatus } from '@/components/tools/ProcessingProgress';
import { organizePDF } from '@/lib/pdf/processors/organize';
import type { ProcessOutput } from '@/types/pdf';

export function usePdfProcessing() {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  const invalidateResult = useCallback(() => {
    setResult(null);
  }, []);

  const resetAll = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
    setResult(null);
    setError(null);
  }, []);

  const processOrganize = useCallback(
    async (file: File, pageOrder: number[]) => {
      if (!file) {
        setError('Please upload a PDF file first.');
        return;
      }

      if (pageOrder.length === 0) {
        setError('No pages to organize.');
        return;
      }

      cancelledRef.current = false;
      setStatus('processing');
      setProgress(0);
      setError(null);
      setResult(null);

      try {
        const output: ProcessOutput = await organizePDF(
          file,
          pageOrder,
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
          setResult(output.result as Blob);
          setStatus('complete');
        } else {
          setError(output.error?.message || 'Failed to organize PDF file.');
          setStatus('error');
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setError(
            err instanceof Error ? err.message : 'An unexpected error occurred.'
          );
          setStatus('error');
        }
      }
    },
    []
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setStatus('idle');
    setProgress(0);
  }, []);

  const isProcessing = status === 'processing' || status === 'uploading';

  return {
    status,
    progress,
    progressMessage,
    result,
    error,
    isProcessing,
    processOrganize,
    cancel,
    invalidateResult,
    resetAll,
    setError,
  };
}
