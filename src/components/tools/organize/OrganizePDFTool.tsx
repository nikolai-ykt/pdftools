'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress, ProcessingStatus } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';
import { organizePDF } from '@/lib/pdf/processors/organize';
import { configurePdfjsWorker } from '@/lib/pdf/loader';
import type { ProcessOutput } from '@/types/pdf';

import { OrganizeFileInfo } from './OrganizeFileInfo';
import { OrganizePageGrid } from './OrganizePageGrid';
import type { OrganizePDFToolProps, PagePreview } from './types';

/**
 * OrganizePDFTool Component
 * Requirements: 5.1, 5.2
 * 
 * Provides the UI for reordering PDF pages with drag-and-drop functionality.
 */
export function OrganizePDFTool({ className = '' }: OrganizePDFToolProps) {
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

  // Page previews and order
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Ref for cancellation
  const cancelledRef = useRef(false);

  /**
   * Load PDF and generate page previews
   */
  const loadPdfPreviews = useCallback(async (pdfFile: File) => {
    setIsLoadingPreviews(true);
    setPagePreviews([]);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      configurePdfjsWorker(pdfjsLib);

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setTotalPages(pdf.numPages);

      // Initialize page order
      const initialOrder = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      setPageOrder(initialOrder);

      // Generate thumbnails for each page
      const previews: PagePreview[] = [];
      const maxPreviewPages = Math.min(pdf.numPages, 100);

      for (let i = 1; i <= maxPreviewPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });

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
            thumbnail: canvas.toDataURL('image/jpeg', 0.85),
          });
        }
      }

      // Add remaining pages without thumbnails
      for (let i = maxPreviewPages + 1; i <= pdf.numPages; i++) {
        previews.push({ pageNumber: i });
      }

      setPagePreviews(previews);
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
    setPageOrder([]);
    setResult(null);
    setError(null);
    setStatus('idle');
    setProgress(0);
  }, []);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setPageOrder(prev => {
        const newOrder = [...prev];
        const [draggedPage] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dragOverIndex, 0, draggedPage);
        return newOrder;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex]);

  /**
   * Move page to a new position
   */
  const handleMovePage = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pageOrder.length) return;
    setPageOrder(prev => {
      const newOrder = [...prev];
      const [movedPage] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedPage);
      return newOrder;
    });
  }, [pageOrder.length]);

  /**
   * Reset to original order
   */
  const handleResetOrder = useCallback(() => {
    setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1));
    setResult(null);
  }, [totalPages]);

  /**
   * Reverse page order
   */
  const handleReverseOrder = useCallback(() => {
    setPageOrder(prev => [...prev].reverse());
    setResult(null);
  }, []);

  /**
   * Duplicate a page at the given index
   */
  const handleDuplicatePage = useCallback((index: number) => {
    setPageOrder(prev => {
      const newOrder = [...prev];
      const pageToDuplicate = newOrder[index];
      newOrder.splice(index + 1, 0, pageToDuplicate);
      return newOrder;
    });
    setResult(null);
  }, []);

  /**
   * Delete a page at the given index
   */
  const handleDeletePage = useCallback((index: number) => {
    if (pageOrder.length <= 1) return;
    setPageOrder(prev => {
      const newOrder = [...prev];
      newOrder.splice(index, 1);
      return newOrder;
    });
    setResult(null);
  }, [pageOrder.length]);

  /**
   * Check if page order has changed relative to original order
   */
  const hasOrderChanged = useMemo(() => {
    if (pageOrder.length !== totalPages) return true;
    return pageOrder.some((num, idx) => num !== idx + 1);
  }, [pageOrder, totalPages]);

  /**
   * Handle organize operation
   */
  const handleOrganize = useCallback(async () => {
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
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        setStatus('error');
      }
    }
  }, [file, pageOrder]);

  /**
   * Handle cancel operation
   */
  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setStatus('idle');
    setProgress(0);
  }, []);

  /**
   * Format file size
   */
  const formatSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  /**
   * Get preview for a page number
   */
  const getPreviewForPage = useCallback((pageNum: number): PagePreview | undefined => {
    return pagePreviews.find(p => p.pageNumber === pageNum);
  }, [pagePreviews]);

  const isProcessing = status === 'processing' || status === 'uploading';
  const canOrganize = file && totalPages > 0 && !isProcessing;

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
          description={tTools('organizePdf.uploadDescription') || 'Drag and drop a PDF file here, or click to browse.'}
        />
      )}

      {/* Error Message */}
      {error && (
        <div
          className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700"
          role="alert"
        >
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* File Info */}
      {file && (
        <OrganizeFileInfo
          file={file}
          totalPages={totalPages}
          isProcessing={isProcessing}
          onClear={handleClearFile}
          formatSize={formatSize}
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
          tReorderTitle={tTools('organizePdf.reorderTitle') || 'Drag to Reorder Pages'}
          tReverseOrder={tTools('organizePdf.reverseOrder') || 'Reverse Order'}
          tResetOrder={tTools('organizePdf.resetOrder') || 'Reset Order'}
          tReorderHint={tTools('organizePdf.reorderHint') || 'Drag and drop pages to reorder them. Use the arrows to move pages up or down.'}
          tLoading={t('status.loading') || 'Loading previews...'}
          tOrderChanged={tTools('organizePdf.orderChanged') || 'Page order has been changed. Click "Apply Changes" to save.'}
          onReverseOrder={handleReverseOrder}
          onResetOrder={handleResetOrder}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onMovePage={handleMovePage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
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
              ? (t('status.processing') || 'Processing...')
              : (tTools('organizePdf.applyButton') || 'Apply Changes')
            }
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
            {tTools('organizePdf.successMessage') || 'PDF pages reorganized successfully! Click the download button to save your file.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default OrganizePDFTool;
