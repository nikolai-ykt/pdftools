'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress, ProcessingStatus } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';
import { rotatePDF } from '@/lib/pdf/processors/rotate';
import { configurePdfjsWorker } from '@/lib/pdf/loader';
import type { ProcessOutput } from '@/types/pdf';

import { PagePreview, CalibrationTab } from './types';
import { RotateFileInfo } from './RotateFileInfo';
import { RotateControlHub } from './RotateControlHub';
import { RotatePreviewGrid } from './RotatePreviewGrid';

export interface RotatePDFToolProps {
  /** Custom class name */
  className?: string;
}

/**
 * RotatePDFTool Component
 * 
 * Provides an extremely premium, smooth UI for rotating PDF pages by 90-degree steps or arbitrary angles.
 * Includes interactive dials, smooth sliders, angle input validation, multi-selection, and elastic transitions.
 */
export function RotatePDFTool({ className = '' }: RotatePDFToolProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools');

  // State
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Page previews and rotations
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [customPageInput, setCustomPageInput] = useState<string>('');

  // Custom calibration states
  const [calibrationTab, setCalibrationTab] = useState<CalibrationTab>('preset');
  const [steplessAngle, setSteplessAngle] = useState<string>('0');

  // Ref for cancellation
  const cancelledRef = useRef(false);

  /**
   * Load PDF and generate page previews
   */
  const loadPdfPreviews = useCallback(async (pdfFile: File) => {
    setIsLoadingPreviews(true);
    setPagePreviews([]);
    setSelectedPages(new Set());

    try {
      const pdfjsLib = await import('pdfjs-dist');
      configurePdfjsWorker(pdfjsLib);

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setTotalPages(pdf.numPages);

      const previews: PagePreview[] = [];
      const maxPreviewPages = Math.min(pdf.numPages, 50);

      for (let i = 1; i <= maxPreviewPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.15 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          previews.push({
            pageNumber: i,
            thumbnail: canvas.toDataURL('image/jpeg', 0.6),
            rotation: 0,
          });
        }
      }

      for (let i = maxPreviewPages + 1; i <= pdf.numPages; i++) {
        previews.push({ pageNumber: i, rotation: 0 });
      }

      setPagePreviews(previews);
      // Default to select all pages initially
      setSelectedPages(new Set(Array.from({ length: pdf.numPages }, (_, i) => i + 1)));
    } catch (err) {
      console.error('Failed to load PDF previews:', err);
      setError('Failed to load PDF preview. The file may be corrupted or encrypted.');
    } finally {
      setIsLoadingPreviews(false);
    }
  }, []);

  /**
   * Handle file selected from uploader
   */
  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setError(null);
      setResult(null);
      loadPdfPreviews(selectedFile);
    }
  }, [loadPdfPreviews]);

  /**
   * Handle file upload error
   */
  const handleUploadError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  /**
   * Clear file and reset state
   */
  const handleClearFile = useCallback(() => {
    setFile(null);
    setTotalPages(0);
    setPagePreviews([]);
    setSelectedPages(new Set());
    setResult(null);
    setError(null);
    setStatus('idle');
    setProgress(0);
    setSteplessAngle('0');
  }, []);

  /**
   * Toggle select/deselect for a page preview
   */
  const handleToggleSelectPage = useCallback((pageNum: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  }, []);

  /**
   * Select all pages
   */
  const handleSelectAll = useCallback(() => {
    setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
  }, [totalPages]);

  /**
   * Clear selection
   */
  const handleClearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  /**
   * Select odd pages
   */
  const handleSelectOdd = useCallback(() => {
    const odds = Array.from({ length: totalPages }, (_, i) => i + 1).filter(num => num % 2 !== 0);
    setSelectedPages(new Set(odds));
  }, [totalPages]);

  /**
   * Select even pages
   */
  const handleSelectEven = useCallback(() => {
    const evens = Array.from({ length: totalPages }, (_, i) => i + 1).filter(num => num % 2 === 0);
    setSelectedPages(new Set(evens));
  }, [totalPages]);

  /**
   * Apply custom page selection
   */
  const handleApplyCustomPages = useCallback(() => {
    if (!customPageInput.trim()) return;
    const pages = new Set<number>();
    const parts = customPageInput.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) {
              pages.add(i);
            }
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          pages.add(num);
        }
      }
    }

    if (pages.size > 0) {
      setSelectedPages(pages);
    }
  }, [customPageInput, totalPages]);

  /**
   * Update rotation on specified pages
   */
  const updateRotationOnPages = useCallback((targetPages: Set<number> | number[], angleUpdater: (current: number) => number) => {
    const targetSet = targetPages instanceof Set ? targetPages : new Set(targetPages);
    setPagePreviews(prev => prev.map(p => {
      if (targetSet.has(p.pageNumber)) {
        const nextRotation = angleUpdater(p.rotation);
        let norm = nextRotation % 360;
        if (norm > 180) norm -= 360;
        if (norm <= -180) norm += 360;
        return { ...p, rotation: Math.round(norm * 10) / 10 };
      }
      return p;
    }));
    setResult(null);
  }, []);

  /**
   * Apply preset rotation incremental addition (e.g. +90 or -90)
   */
  const handleApplyPresetRotation = useCallback((angle: number) => {
    const target = selectedPages.size > 0
      ? selectedPages
      : new Set(Array.from({ length: totalPages }, (_, i) => i + 1));

    updateRotationOnPages(target, current => current + angle);
  }, [selectedPages, totalPages, updateRotationOnPages]);

  /**
   * Directly set absolute fine-grain angle for selected pages (or all if none selected)
   */
  const handleApplyAbsoluteRotation = useCallback((angle: number) => {
    const target = selectedPages.size > 0
      ? selectedPages
      : new Set(Array.from({ length: totalPages }, (_, i) => i + 1));

    updateRotationOnPages(target, () => angle);
  }, [selectedPages, totalPages, updateRotationOnPages]);

  /**
   * Reset all page rotations
   */
  const handleResetAll = useCallback(() => {
    setPagePreviews(prev => prev.map(p => ({ ...p, rotation: 0 })));
    setSteplessAngle('0');
    setResult(null);
  }, []);

  /**
   * Handle rotate operation
   */
  const handleRotate = useCallback(async () => {
    if (!file) {
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
        file,
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
  }, [file, pagePreviews]);

  /**
   * Handle cancel operation
   */
  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setStatus('idle');
    setProgress(0);
  }, []);

  const isProcessing = status === 'processing' || status === 'uploading';
  const hasRotations = pagePreviews.some(p => p.rotation !== 0);
  const canRotate = file && totalPages > 0 && hasRotations && !isProcessing;
  const rotatedCount = pagePreviews.filter(p => p.rotation !== 0).length;

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* File Upload Area */}
      {!file && (
        <FileUploader
          accept={['application/pdf', '.pdf']}
          multiple={false}
          maxFiles={1}
          onFilesSelected={handleFilesSelected}
          onError={handleUploadError}
          disabled={isProcessing}
          label={tTools('rotatePdf.uploadLabel') || 'Upload PDF File'}
          description={tTools('rotatePdf.uploadDescription') || 'Drag and drop a PDF file here, or click to browse.'}
        />
      )}

      {/* Error Message */}
      {error && (
        <div
          className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400"
          role="alert"
        >
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* File Info */}
      {file && (
        <RotateFileInfo
          file={file}
          totalPages={totalPages}
          isProcessing={isProcessing}
          onClearFile={handleClearFile}
        />
      )}

      {/* Master Interactive Workspace Grid */}
      {file && totalPages > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Rotational Calibration Hub */}
          <div className="lg:col-span-4 space-y-6">
            <RotateControlHub
              selectedPages={selectedPages}
              totalPages={totalPages}
              calibrationTab={calibrationTab}
              setCalibrationTab={setCalibrationTab}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              presetPanelProps={{
                selectedPages,
                isProcessing,
                hasRotations,
                customPageInput,
                setCustomPageInput,
                onApplyPresetRotation: handleApplyPresetRotation,
                onResetAll: handleResetAll,
                onSelectOdd: handleSelectOdd,
                onSelectEven: handleSelectEven,
                onApplyCustomPages: handleApplyCustomPages,
              }}
              steplessPanelProps={{
                steplessAngle,
                setSteplessAngle,
                selectedPages,
                isProcessing,
                status,
                onApplyAbsoluteRotation: handleApplyAbsoluteRotation,
              }}
            />

            {/* Run Operations Button Area */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleRotate}
                disabled={!canRotate}
                loading={isProcessing}
                className="w-full py-4 font-bold shadow-lg shadow-[hsl(var(--color-primary)/0.15)] flex gap-2 items-center justify-center"
              >
                {!isProcessing && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.5" />
                  </svg>
                )}
                {isProcessing
                  ? tTools('status.processing')
                  : tTools('rotate.processButton', { count: rotatedCount })
                }
              </Button>

              {result && (
                <DownloadButton
                  file={result}
                  filename={file.name.replace('.pdf', '_rotated.pdf')}
                  variant="secondary"
                  size="lg"
                  className="w-full py-4 border-2 border-[hsl(var(--color-secondary-hover))]"
                  showFileSize
                />
              )}
            </div>

            {/* Success Prompt */}
            {status === 'complete' && result && (
              <div
                className="p-4 rounded-[var(--radius-md)] bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-400 text-center animate-in fade-in"
                role="status"
              >
                <p className="text-sm font-semibold">
                  {tTools('rotate.successMessage')}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Live Physics Preview Grid */}
          <RotatePreviewGrid
            pagePreviews={pagePreviews}
            selectedPages={selectedPages}
            isLoadingPreviews={isLoadingPreviews}
            isProcessing={isProcessing}
            onToggleSelectPage={handleToggleSelectPage}
            onRotatePage={updateRotationOnPages}
          />
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <ProcessingProgress
          progress={progress}
          status={status}
          message={progressMessage}
          onCancel={handleCancel}
          showPercentage
        />
      )}
    </div>
  );
}

export default RotatePDFTool;
