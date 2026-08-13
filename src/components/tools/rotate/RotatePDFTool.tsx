'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress } from '@/components/tools/ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';

import { CalibrationTab } from './types';
import { getTargetPages } from './utils/pageUtils';
import { usePdfPreviews } from './hooks/usePdfPreviews';
import { usePageSelection } from './hooks/usePageSelection';
import { useRotatePdf } from './hooks/useRotatePdf';

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
  const tTools = useTranslations('tools');

  // Custom Calibration State
  const [calibrationTab, setCalibrationTab] = useState<CalibrationTab>('preset');
  const [steplessAngle, setSteplessAngle] = useState<string>('0');

  // Custom Hooks
  const {
    pagePreviews,
    setPagePreviews,
    isLoadingPreviews,
    totalPages,
    previewError,
    setPreviewError,
    loadPdfPreviews,
    resetPreviews,
  } = usePdfPreviews();

  const {
    selectedPages,
    setSelectedPages,
    customPageInput,
    setCustomPageInput,
    handleToggleSelectPage,
    handleSelectAll,
    handleClearSelection,
    handleSelectOdd,
    handleSelectEven,
    handleApplyCustomPages,
    resetSelection,
  } = usePageSelection(totalPages);

  const {
    file,
    setFile,
    status,
    progress,
    progressMessage,
    result,
    setResult,
    error,
    setError,
    handleRotate,
    handleCancel,
    resetRotateState,
  } = useRotatePdf();

  // Automatically select all pages once PDF previews are loaded initially
  useEffect(() => {
    if (totalPages > 0 && selectedPages.size === 0) {
      handleSelectAll();
    }
  }, [totalPages]);

  // Unified Full State Reset Helper
  const resetAllState = useCallback(() => {
    resetPreviews();
    resetSelection();
    resetRotateState();
    setCalibrationTab('preset');
    setSteplessAngle('0');
  }, [resetPreviews, resetSelection, resetRotateState]);

  // Unified File Selection Handler
  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      resetAllState();
      setFile(selectedFile);
      loadPdfPreviews(selectedFile);
    }
  }, [resetAllState, setFile, loadPdfPreviews]);

  const handleUploadError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, [setError]);

  const handleClearFile = useCallback(() => {
    resetAllState();
  }, [resetAllState]);

  // Rotation Manipulation Handlers
  const updateRotationOnPages = useCallback((
    targetPages: Set<number> | number[],
    angleUpdater: (current: number) => number
  ) => {
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
  }, [setPagePreviews, setResult]);

  const handleApplyPresetRotation = useCallback((angle: number) => {
    const target = getTargetPages(selectedPages, totalPages);
    updateRotationOnPages(target, current => current + angle);
  }, [selectedPages, totalPages, updateRotationOnPages]);

  const handleApplyAbsoluteRotation = useCallback((angle: number) => {
    const target = getTargetPages(selectedPages, totalPages);
    updateRotationOnPages(target, () => angle);
  }, [selectedPages, totalPages, updateRotationOnPages]);

  const handleResetAll = useCallback(() => {
    setPagePreviews(prev => prev.map(p => ({ ...p, rotation: 0 })));
    setSteplessAngle('0');
    setResult(null);
  }, [setPagePreviews, setResult]);

  const onExecuteRotate = useCallback(() => {
    if (file) {
      handleRotate(file, pagePreviews);
    }
  }, [file, pagePreviews, handleRotate]);

  // Derived Values
  const activeError = error || previewError;
  const isProcessing = status === 'processing' || status === 'uploading';
  const hasRotations = pagePreviews.some(p => p.rotation !== 0);
  const canRotate = Boolean(file && totalPages > 0 && hasRotations && !isProcessing);
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

      {/* Error Message Banner */}
      {activeError && (
        <div
          className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400"
          role="alert"
        >
          <p className="text-sm">{activeError}</p>
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
                onClick={onExecuteRotate}
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
