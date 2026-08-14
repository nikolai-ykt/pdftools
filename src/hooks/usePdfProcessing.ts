'use client';

import { useState, useCallback, useRef } from 'react';
import type { ProcessingStatus } from '@/components/tools/ProcessingProgress';
import type { ProcessOutput } from '@/types/pdf';

export interface UsePdfProcessingReturn {
  status: ProcessingStatus;
  progress: number;
  progressMessage: string;
  result: Blob | null;
  error: string | null;
  isProcessing: boolean;
  isComplete: boolean;
  isError: boolean;
  isIdle: boolean;
  execute: (
    processorFn: (
      onProgress: (progress: number, message?: string) => void,
      signal: { isCancelled: boolean }
    ) => Promise<Blob | ProcessOutput | null | undefined>
  ) => Promise<Blob | null>;
  cancel: () => void;
  reset: () => void;
  setStatus: (status: ProcessingStatus) => void;
  setProgress: (progress: number) => void;
  setProgressMessage: (message: string) => void;
  setResult: (result: Blob | null) => void;
  setError: (error: string | null) => void;
}

/**
 * Universal hook for managing PDF processing lifecycle, progress, cancelation and results.
 */
export function usePdfProcessing(): UsePdfProcessingReturn {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
    setResult(null);
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
  }, []);

  const execute = useCallback(
    async (
      processorFn: (
        onProgress: (progress: number, message?: string) => void,
        signal: { isCancelled: boolean }
      ) => Promise<Blob | ProcessOutput | null | undefined>
    ): Promise<Blob | null> => {
      cancelledRef.current = false;
      setStatus('processing');
      setProgress(0);
      setProgressMessage('');
      setError(null);
      setResult(null);

      const onProgress = (currentProgress: number, message?: string) => {
        if (cancelledRef.current) return;
        setProgress(currentProgress);
        if (message !== undefined) {
          setProgressMessage(message);
        }
      };

      try {
        const output = await processorFn(onProgress, {
          get isCancelled() {
            return cancelledRef.current;
          },
        });

        if (cancelledRef.current) {
          return null;
        }

        let resultBlob: Blob | null = null;

        if (output instanceof Blob) {
          resultBlob = output;
        } else if (output && typeof output === 'object' && 'success' in output) {
          const processOutput = output as ProcessOutput;
          if (processOutput.success && processOutput.result) {
            resultBlob = Array.isArray(processOutput.result)
              ? processOutput.result[0]
              : processOutput.result;
          } else if (processOutput.error) {
            throw new Error(processOutput.error.message || 'Processing failed');
          }
        }

        if (resultBlob) {
          setResult(resultBlob);
          setStatus('complete');
          setProgress(100);
          return resultBlob;
        } else {
          throw new Error('No output generated');
        }
      } catch (err: unknown) {
        if (cancelledRef.current) return null;
        const errorMessage = err instanceof Error ? err.message : 'Unknown processing error';
        setError(errorMessage);
        setStatus('error');
        return null;
      }
    },
    []
  );

  return {
    status,
    progress,
    progressMessage,
    result,
    error,
    isProcessing: status === 'processing' || status === 'uploading',
    isComplete: status === 'complete',
    isError: status === 'error',
    isIdle: status === 'idle',
    execute,
    cancel,
    reset,
    setStatus,
    setProgress,
    setProgressMessage,
    setResult,
    setError,
  };
}
