'use client';

import React, { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';

import { OrganizeFileInfo } from './OrganizeFileInfo';
import { OrganizePageGrid } from './OrganizePageGrid';
import type { OrganizePDFToolProps } from './types';

import { usePdfOrganizer } from './hooks/usePdfOrganizer';
import { usePdfPreviews } from './hooks/usePdfPreviews';
import { usePdfProcessing } from './hooks/usePdfProcessing';

/**
 * Pure utility function to format file size in human readable format.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * OrganizePDFTool Component
 * Requirements: 5.1, 5.2
 * 
 * Refactored architecture:
 * - State modularized into usePdfOrganizer, usePdfPreviews, and usePdfProcessing
 * - Fast Map-based preview lookups
 * - Concurrent thumbnail generation with Blob Object URLs & memory cleanup
 * - Abort safety & race-condition protection
 */
export function OrganizePDFTool({ className = '' }: OrganizePDFToolProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools');

  const {
    file,
    totalPages,
    pageOrder,
    draggedIndex,
    dragOverIndex,
    hasOrderChanged,
    selectFile,
    clearFile,
    movePage,
    duplicatePage,
    deletePage,
    reverseOrder,
    resetOrder,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = usePdfOrganizer();

  const {
    pagePreviews,
    isLoadingPreviews,
    previewError,
    loadPdfPreviews,
    clearPreviews,
    getPreviewForPage,
  } = usePdfPreviews();

  const {
    status,
    progress,
    progressMessage,
    result,
    error: processingError,
    isProcessing,
    processOrganize,
    cancel: handleCancel,
    invalidateResult,
    resetAll,
    setError,
  } = usePdfProcessing();

  const activeError = previewError || processingError;

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (files.length > 0) {
        const selectedFile = files[0];
        resetAll();
        const count = await loadPdfPreviews(selectedFile);
        if (count > 0) {
          selectFile(selectedFile, count);
        }
      }
    },
    [resetAll, loadPdfPreviews, selectFile]
  );

  const handleUploadError = useCallback(
    (errorMessage: string) => {
      setError(errorMessage);
    },
    [setError]
  );

  const handleClearFile = useCallback(() => {
    clearFile();
    clearPreviews();
    resetAll();
  }, [clearFile, clearPreviews, resetAll]);

  const handleMovePageWithInvalidate = useCallback(
    (fromIndex: number, toIndex: number) => {
      movePage(fromIndex, toIndex);
      invalidateResult();
    },
    [movePage, invalidateResult]
  );

  const handleDuplicatePageWithInvalidate = useCallback(
    (index: number) => {
      duplicatePage(index);
      invalidateResult();
    },
    [duplicatePage, invalidateResult]
  );

  const handleDeletePageWithInvalidate = useCallback(
    (index: number) => {
      deletePage(index);
      invalidateResult();
    },
    [deletePage, invalidateResult]
  );

  const handleReverseOrderWithInvalidate = useCallback(() => {
    reverseOrder();
    invalidateResult();
  }, [reverseOrder, invalidateResult]);

  const handleResetOrderWithInvalidate = useCallback(() => {
    resetOrder();
    invalidateResult();
  }, [resetOrder, invalidateResult]);

  const handleDragEndWithInvalidate = useCallback(() => {
    handleDragEnd();
    invalidateResult();
  }, [handleDragEnd, invalidateResult]);

  const handleOrganize = useCallback(() => {
    if (file) {
      processOrganize(file, pageOrder);
    }
  }, [file, pageOrder, processOrganize]);

  const canOrganize =
    file !== null && totalPages > 0 && pageOrder.length > 0 && !isProcessing;

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
          label={tTools('organizePdf.uploadLabel') || 'Upload PDF File'}
          description={
            tTools('organizePdf.uploadDescription') ||
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
        <OrganizeFileInfo
          file={file}
          totalPages={totalPages}
          isProcessing={isProcessing}
          onClear={handleClearFile}
          formatSize={formatFileSize}
          tRemove={t('buttons.remove') || 'Remove'}
        />
      )}

      {/* Page Reorder Grid */}
      {file && pagePreviews.length > 0 && (
        <OrganizePageGrid
          file={file}
          pagePreviews={pagePreviews}
          pageOrder={pageOrder}
          isLoadingPreviews={isLoadingPreviews}
          isProcessing={isProcessing}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          hasOrderChanged={hasOrderChanged}
          tReorderTitle={
            tTools('organizePdf.reorderTitle') || 'Drag to Reorder Pages'
          }
          tReverseOrder={tTools('organizePdf.reverseOrder') || 'Reverse Order'}
          tResetOrder={tTools('organizePdf.resetOrder') || 'Reset Order'}
          tReorderHint={
            tTools('organizePdf.reorderHint') ||
            'Drag and drop pages to reorder them. Use the arrows to move pages up or down.'
          }
          tLoading={t('status.loading') || 'Loading previews...'}
          tOrderChanged={
            tTools('organizePdf.orderChanged') ||
            'Page order has been changed. Click "Apply Changes" to save.'
          }
          onReverseOrder={handleReverseOrderWithInvalidate}
          onResetOrder={handleResetOrderWithInvalidate}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEndWithInvalidate}
          onMovePage={handleMovePageWithInvalidate}
          onDuplicatePage={handleDuplicatePageWithInvalidate}
          onDeletePage={handleDeletePageWithInvalidate}
          getPreviewForPage={getPreviewForPage}
        />
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

      {/* Action Buttons */}
      {file && (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleOrganize}
            disabled={!canOrganize}
            loading={isProcessing}
          >
            {isProcessing
              ? t('status.processing') || 'Processing...'
              : tTools('organizePdf.applyButton') || 'Apply Changes'}
          </Button>

          {result && (
            <DownloadButton
              file={result}
              filename={file.name.replace('.pdf', '_organized.pdf')}
              variant="secondary"
              size="lg"
              showFileSize
            />
          )}
        </div>
      )}

      {/* Success Message */}
      {status === 'complete' && result && (
        <div
          className="p-4 rounded-[var(--radius-md)] bg-green-50 border border-green-200 text-green-700"
          role="status"
        >
          <p className="text-sm font-medium">
            {tTools('organizePdf.successMessage') ||
              'PDF pages reorganized successfully! Click the download button to save your file.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default OrganizePDFTool;
