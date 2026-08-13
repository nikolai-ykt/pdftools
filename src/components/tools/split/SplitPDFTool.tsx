'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress } from '../ProcessingProgress';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import type { SplitMode } from './utils/calculateSplitRanges';
import { usePdfDocument } from './hooks/usePdfDocument';
import { usePdfPreviews } from './hooks/usePdfPreviews';
import { usePdfSplitter } from './hooks/usePdfSplitter';
import { FileInfo } from './FileInfo';
import { SplitModeSelector } from './SplitModeSelector';
import { SplitModeOptions } from './SplitModeOptions';
import { PagePreviewGrid } from './PagePreviewGrid';
import { SplitResults } from './SplitResults';

export interface SplitPDFToolProps {
  /** Custom class name */
  className?: string;
}

/**
 * SplitPDFTool Component
 * Requirements: 5.1, 5.2
 *
 * Modularized UI for splitting PDF files with range selection, visual previews, and mode options.
 */
export function SplitPDFTool({ className = '' }: SplitPDFToolProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools');

  // File state
  const [file, setFile] = useState<File | null>(null);

  // Split options state
  const [splitMode, setSplitMode] = useState<SplitMode>('ranges');
  const [rangeInput, setRangeInput] = useState('');
  const [splitCount, setSplitCount] = useState(2);
  const [evenOddMode, setEvenOddMode] = useState<'odd' | 'even' | 'both'>('both');

  // Custom PDF Document Hook
  const { pdfDoc, totalPages, bookmarks, error: docError, clearDocument } = usePdfDocument(file);

  // Custom PDF Previews Hook
  const {
    pagePreviews,
    selectedPages,
    isLoadingPreviews,
    handleTogglePage,
    handleSelectAll,
    handleDeselectAll,
    setSelectedPages,
  } = usePdfPreviews(pdfDoc, totalPages);

  // Custom PDF Splitter Hook
  const {
    status,
    progress,
    progressMessage,
    results,
    error: splitError,
    canSplit,
    isProcessing,
    split,
    cancel,
    setError,
    reset: resetSplitter,
  } = usePdfSplitter({
    file,
    splitMode,
    totalPages,
    selectedPages,
    rangeInput,
    splitCount,
    evenOddMode,
    bookmarks,
  });

  const activeError = docError || splitError;

  /**
   * Handle file selection
   */
  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setSelectedPages(new Set());
      setRangeInput('');
      resetSplitter();
    }
  }, [setSelectedPages, resetSplitter]);

  /**
   * Clear current file & reset tool state
   */
  const handleClearFile = useCallback(async () => {
    setFile(null);
    setSelectedPages(new Set());
    setRangeInput('');
    await clearDocument();
    resetSplitter();
  }, [clearDocument, setSelectedPages, resetSplitter]);

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* File Upload Area */}
      {!file && (
        <FileUploader
          accept={['application/pdf', '.pdf']}
          multiple={false}
          maxFiles={1}
          onFilesSelected={handleFilesSelected}
          onError={(msg) => setError(msg)}
          disabled={isProcessing}
          label={tTools('splitPdf.uploadLabel') || 'Upload PDF File'}
          description={
            tTools('splitPdf.uploadDescription') ||
            'Drag and drop a PDF file here, or click to browse.'
          }
        />
      )}

      {/* Error Message */}
      {activeError && (
        <div
          className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700"
          role="alert"
        >
          <p className="text-sm">{activeError}</p>
        </div>
      )}

      {/* File Info */}
      {file && (
        <FileInfo
          file={file}
          totalPages={totalPages}
          onRemove={handleClearFile}
          disabled={isProcessing}
        />
      )}

      {/* Split Mode Selection & Options */}
      {file && totalPages > 0 && (
        <Card variant="outlined" size="lg">
          <h3 className="text-lg font-medium text-[hsl(var(--color-foreground))] mb-4">
            {tTools('splitPdf.splitModeTitle') || 'Split Method'}
          </h3>

          <div className="space-y-4">
            <SplitModeSelector
              value={splitMode}
              onChange={setSplitMode}
              disabled={isProcessing}
              bookmarkCount={bookmarks.length}
            />

            <SplitModeOptions
              splitMode={splitMode}
              totalPages={totalPages}
              isProcessing={isProcessing}
              rangeInput={rangeInput}
              onRangeInputChange={setRangeInput}
              evenOddMode={evenOddMode}
              onEvenOddModeChange={setEvenOddMode}
              bookmarks={bookmarks}
              splitCount={splitCount}
              onSplitCountChange={setSplitCount}
            />
          </div>
        </Card>
      )}

      {/* Page Preview Grid */}
      {file && pagePreviews.length > 0 && (splitMode === 'ranges' || splitMode === 'visual') && (
        <PagePreviewGrid
          pagePreviews={pagePreviews}
          selectedPages={selectedPages}
          isLoadingPreviews={isLoadingPreviews}
          isProcessing={isProcessing}
          onTogglePage={handleTogglePage}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <ProcessingProgress
          progress={progress}
          status={status}
          message={progressMessage}
          onCancel={cancel}
          showPercentage
        />
      )}

      {/* Action Button */}
      {file && (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={split}
            disabled={!canSplit}
            loading={isProcessing}
          >
            {isProcessing
              ? t('status.processing') || 'Processing...'
              : tTools('splitPdf.splitButton') || 'Split PDF'}
          </Button>
        </div>
      )}

      {/* Split Results */}
      {status === 'complete' && results.length > 0 && (
        <SplitResults
          results={results}
          originalFileName={file?.name}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}

export default SplitPDFTool;
