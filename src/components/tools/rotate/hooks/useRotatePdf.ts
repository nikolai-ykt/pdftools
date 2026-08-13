'use client';

import { useState, useCallback, useRef } from 'react';
import { rotatePDF } from '@/lib/pdf/processors/rotate';
import type { ProcessOutput } from '@/types/pdf';
import type { ProcessingStatus } from '@/components/tools/ProcessingProgress';
import type { PagePreview } from '../types';

export function useRotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  const resetRotateState = useCallback(() => {
    cancelledRef.current = true;
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
    setResult(null);
    setError(null);
  }, []);

  const handleRotate = useCallback(async (currentFile: File, pagePreviews: PagePreview[]) => {
    if (!currentFile) {
      setError('Please upload a PDF file first.');
      return;
    }

    const hasRotations = pagePreviews.some(p => p.rotation !== 0);
    if (!hasRotations) {
      setError('Please rotate at least one page before processing.');
      return;
    }

    cancelledRef.current = false;
    setStatus('processing');
    setProgress(0);
    setError(null);
    setResult(null);

    const rotations: Record<number, number> = {};
    pagePreviews.forEach(p => {
      if (p.rotation !== 0) {
        const norm360 = (p.rotation % 360 + 360) % 360;
        rotations[p.pageNumber] = Math.round(norm360 * 10) / 10;
      }
    });

    try {
      const output: ProcessOutput = await rotatePDF(
        currentFile,
        { rotations },
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
        setError(output.error?.message || 'Failed to rotate PDF.');
        setStatus('error');
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        setStatus('error');
      }
    }
  }, []);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
  }, []);

  return {
    file,
    setFile,
    status,
    setStatus,
    progress,
    setProgress,
    progressMessage,
    setProgressMessage,
    result,
    setResult,
    error,
    setError,
    handleRotate,
    handleCancel,
    resetRotateState,
  };
}
