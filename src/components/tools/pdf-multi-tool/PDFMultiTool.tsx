'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress } from '../ProcessingProgress';
import { Card } from '@/components/ui/Card';
import type { PDFMultiToolProps } from './types';
import { usePdfDocument } from './hooks/usePdfDocument';
import { usePdfExport } from './hooks/usePdfExport';

import { PDFToolbar } from './components/PDFToolbar';
import { PDFPageGrid } from './components/PDFPageGrid';
import { PDFExportActions } from './components/PDFExportActions';
import { AddBlankPageModal } from './components/AddBlankPageModal';

/**
 * PDFMultiTool Component
 * All-in-one PDF editor with multi-file support and modular architecture
 */
export function PDFMultiTool({ className = '' }: PDFMultiToolProps) {
  const tTools = useTranslations('tools');

  const {
    pages,
    sources,
    selectedIds,
    thumbnails,
    isLoadingPreviews,
    error: docError,

    canUndo,
    canRedo,

    addFiles,
    selectPage,
    selectAll,
    deselectAll,
    rotatePage,
    rotateSelected,
    deletePage,
    deleteSelected,
    duplicatePage,
    duplicateSelected,
    addBlankPages,
    movePage,
    undo,
    redo,
    reset,
  } = usePdfDocument();

  const {
    status,
    progress,
    progressMessage,
    result,
    error: exportError,
    exportPdf,
    downloadSelected,
    handleCancel,
  } = usePdfExport({
    pages,
    sources,
    selectedIds,
  });

  const [showBlankModal, setShowBlankModal] = useState(false);

  const activeError = docError || exportError;
  const isProcessing = status === 'processing' || isLoadingPreviews;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload Section */}
      <FileUploader
        onFilesSelected={addFiles}
        accept={['.pdf']}
        multiple
        label={tTools('pdfMultiTool.uploadTitle') || 'Drop PDF files here'}
        description={tTools('pdfMultiTool.uploadDescription') || 'Support multi-file upload & merge'}
      />

      {/* Error Banner */}
      {activeError && (
        <Card variant="outlined" className="!bg-red-50 dark:!bg-red-900/20 !border-red-200 dark:!border-red-800">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {activeError === 'DELETE_ALL_PAGES'
              ? tTools('pdfMultiTool.errors.deleteAllPages') || 'Cannot delete all pages. At least one page is required.'
              : activeError === 'LOAD_FAILED'
              ? tTools('pdfMultiTool.errors.loadFailed') || 'Failed to load PDF file. Please try another file.'
              : tTools('pdfMultiTool.errors.general') || 'An error occurred during PDF processing.'}
          </p>
        </Card>
      )}

      {/* Editor Grid Container */}
      {pages.length > 0 && (
        <Card variant="outlined" size="lg" className="!p-0 overflow-hidden">
          {/* Action Toolbar */}
          <PDFToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            pageCount={pages.length}
            selectedCount={selectedIds.size}
            onUndo={undo}
            onRedo={redo}
            onReset={reset}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onRotateSelected={rotateSelected}
            onDuplicateSelected={duplicateSelected}
            onAddBlank={() => setShowBlankModal(true)}
            onDeleteSelected={deleteSelected}
          />

          {/* Page Grid */}
          <PDFPageGrid
            pages={pages}
            sources={sources}
            selectedIds={selectedIds}
            thumbnails={thumbnails}
            onSelect={selectPage}
            onRotate={rotatePage}
            onDuplicate={duplicatePage}
            onDelete={deletePage}
            onMove={movePage}
          />

          {/* Footer Actions */}
          <PDFExportActions
            pageCount={pages.length}
            selectedCount={selectedIds.size}
            isProcessing={isProcessing}
            result={result}
            onDownloadSelected={downloadSelected}
            onExport={exportPdf}
          />
        </Card>
      )}

      {/* Add Blank Page Modal */}
      <AddBlankPageModal
        open={showBlankModal}
        totalPages={pages.length}
        onClose={() => setShowBlankModal(false)}
        onAdd={addBlankPages}
      />

      {/* Processing Progress Overlay */}
      {isProcessing && (
        <ProcessingProgress
          progress={progress}
          status={status}
          message={progressMessage}
          onCancel={handleCancel}
          showPercentage
        />
      )}

      {/* Complete Success Card */}
      {status === 'complete' && result && (
        <Card variant="outlined" className="!bg-green-50 dark:!bg-green-900/20 !border-green-200 dark:!border-green-800">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {tTools('pdfMultiTool.successMessage') || 'PDF processed successfully! Click the download button to save your file.'}
          </p>
        </Card>
      )}
    </div>
  );
}

export type { PDFMultiToolProps };
export default PDFMultiTool;
