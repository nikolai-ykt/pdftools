'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress, ProcessingStatus } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { processBookmarks, type BookmarkItem, type BookmarkOptions } from '@/lib/pdf/processors/bookmark';
import type { ProcessOutput } from '@/types/pdf';
import { useBookmarkTree } from './hooks/useBookmarkTree';
import { useBookmarkPdfLoader } from './hooks/useBookmarkPdfLoader';
import { BookmarkTree } from './components/BookmarkTree';
import type { BookmarkNode } from './types';

export interface BookmarkToolProps {
  className?: string;
}

/**
 * BookmarkTool Component - Visual Bookmark Editor
 */
export function BookmarkTool({ className = '' }: BookmarkToolProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools');

  // File & Processing State
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  // Hook 1: Pdf Loader & Canvas Render
  const {
    pdfDoc,
    totalPages,
    currentPage,
    setCurrentPage,
    isExtractingBookmarks,
    canvasRef,
    loadPdf,
    clearPdf,
    handleExtractBookmarks,
  } = useBookmarkPdfLoader(
    (extracted) => setBookmarks(extracted),
    (err) => setError(err)
  );

  // Hook 2: Bookmark Tree & Drag-and-Drop
  const {
    bookmarks,
    setBookmarks,
    selectedBookmarkId,
    editingBookmark,
    setEditingBookmark,
    draggedNodeId,
    dragOverNodeId,
    dropPosition,
    handleBookmarkClick,
    handleAddBookmark,
    handleAddChild,
    handleDeleteBookmark,
    handleUpdateBookmark,
    handleToggleExpand,
    handleSortBookmarks,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useBookmarkTree(currentPage);

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setError(null);
      setResult(null);
      setBookmarks([]);
      loadPdf(files[0]);
    }
  }, [loadPdf, setBookmarks]);

  const handleClearFile = useCallback(() => {
    setFile(null);
    clearPdf();
    setBookmarks([]);
    setResult(null);
    setError(null);
    setStatus('idle');
  }, [clearPdf, setBookmarks]);

  // Convert Tree structure to flat BookmarkItem array for PDF processor
  const convertTreeToItems = useCallback((nodes: BookmarkNode[]): BookmarkItem[] => {
    return nodes.map(node => ({
      id: node.id,
      title: node.title,
      pageNumber: node.pageNumber,
      color: node.color,
      style: node.style,
      children: node.children ? convertTreeToItems(node.children) : [],
    }));
  }, []);

  // Save Bookmarks to PDF
  const handleProcess = useCallback(async () => {
    if (!file) {
      setError('Please upload a PDF file first.');
      return;
    }

    if (bookmarks.length === 0) {
      setError('Please add at least one bookmark.');
      return;
    }

    cancelledRef.current = false;
    setStatus('processing');
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const bookmarkItems = convertTreeToItems(bookmarks);
      const options: BookmarkOptions = { action: 'edit', bookmarks: bookmarkItems };

      const output: ProcessOutput = await processBookmarks(
        file,
        options,
        (prog) => {
          if (!cancelledRef.current) {
            setProgress(prog);
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
        setProgress(100);
      } else {
        setError(output.error?.message || 'Failed to process bookmarks.');
        setStatus('error');
      }
    } catch (err: any) {
      if (!cancelledRef.current) {
        setError(err.message || 'An error occurred while processing PDF.');
        setStatus('error');
      }
    }
  }, [file, bookmarks, convertTreeToItems]);

  const isProcessing = status === 'processing';

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {!file && (
        <FileUploader
          accept={['application/pdf', '.pdf']}
          multiple={false}
          maxFiles={1}
          onFilesSelected={handleFilesSelected}
          onError={setError}
          disabled={isProcessing}
          label={tTools('bookmark.uploadLabel') || 'Upload PDF File'}
          description={tTools('bookmark.uploadDescription') || 'Drag and drop a PDF file to edit bookmarks.'}
        />
      )}

      {error && (
        <div className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700" role="alert">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {file && pdfDoc && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* PDF Preview Panel */}
          <Card variant="outlined" size="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{tTools('bookmark.pdfPreview') || 'PDF Preview'}</h3>
              <Button variant="ghost" size="sm" onClick={handleClearFile}>
                {t('buttons.close') || 'Close'}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                ← {t('buttons.back') || 'Prev'}
              </Button>
              <span className="text-sm">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                {t('buttons.next') || 'Next'} →
              </Button>
            </div>

            <div className="flex justify-center bg-gray-100 rounded p-4 overflow-auto max-h-[600px]">
              <canvas ref={canvasRef} className="shadow-lg" />
            </div>
          </Card>

          {/* Bookmark Editor Panel */}
          <Card variant="outlined" size="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{tTools('bookmark.bookmarksTitle') || 'Bookmarks'}</h3>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleExtractBookmarks(
                      bookmarks.length > 0,
                      tTools('bookmark.replaceConfirm') || 'This will replace current bookmarks. Continue?',
                      tTools('bookmark.noBookmarksFound') || 'No bookmarks found in this PDF.',
                      tTools('bookmark.failedExtract') || 'Failed to extract bookmarks.'
                    )
                  }
                  title={tTools('bookmark.extractExisting') || 'Extract Existing Bookmarks'}
                >
                  📥 {tTools('bookmark.extractExisting') || 'Extract'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSortBookmarks}
                  title={tTools('bookmark.sortByPage') || 'Sort by page number'}
                  disabled={bookmarks.length === 0}
                >
                  ↑↓ {tTools('bookmark.sort') || 'Sort'}
                </Button>
                <Button variant="primary" size="sm" onClick={handleAddBookmark}>
                  + {tTools('bookmark.addBookmark') || 'Add Bookmark'}
                </Button>
              </div>
            </div>

            {isExtractingBookmarks && (
              <p className="text-sm text-gray-500 mb-4">
                {tTools('bookmark.extracting') || 'Extracting existing bookmarks...'}
              </p>
            )}

            <div className="border rounded max-h-[500px] overflow-y-auto">
              {bookmarks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>{tTools('bookmark.noBookmarks') || 'No bookmarks yet. Click "Add Bookmark" to create one.'}</p>
                </div>
              ) : (
                <BookmarkTree
                  bookmarks={bookmarks}
                  selectedBookmarkId={selectedBookmarkId}
                  editingBookmark={editingBookmark}
                  draggedNodeId={draggedNodeId}
                  dragOverNodeId={dragOverNodeId}
                  dropPosition={dropPosition}
                  totalPages={totalPages}
                  onBookmarkClick={(b) => handleBookmarkClick(b, (p) => setCurrentPage(p))}
                  onToggleExpand={handleToggleExpand}
                  onAddChild={handleAddChild}
                  onDeleteBookmark={handleDeleteBookmark}
                  onEditBookmark={(b) => setEditingBookmark(b)}
                  setEditingBookmark={setEditingBookmark}
                  onSaveBookmark={handleUpdateBookmark}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  t={t}
                  tTools={tTools}
                />
              )}
            </div>

            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">
                {tTools('bookmark.hint') || 'Click a bookmark to preview its page. Use +/✎/× to add child, edit, or delete.'}
              </p>
              <p className="text-xs text-blue-500 font-medium">
                {tTools('bookmark.dragHint') || 'Drag and drop to reorder bookmarks.'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {isProcessing && (
        <ProcessingProgress
          progress={progress}
          status={status}
          onCancel={() => {
            cancelledRef.current = true;
            setStatus('idle');
          }}
          showPercentage
        />
      )}

      {file && bookmarks.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleProcess}
            disabled={isProcessing}
            loading={isProcessing}
          >
            {isProcessing
              ? t('status.processing') || 'Processing...'
              : tTools('bookmark.saveButton') || 'Save Bookmarks'}
          </Button>

          {result && (
            <DownloadButton
              file={result}
              filename={file.name.replace('.pdf', '_bookmarked.pdf')}
              variant="secondary"
              size="lg"
              showFileSize
            />
          )}
        </div>
      )}

      {status === 'complete' && result && (
        <div className="p-4 rounded-[var(--radius-md)] bg-green-50 border border-green-200 text-green-700">
          <p className="text-sm font-medium">
            {tTools('bookmark.success') || 'Bookmarks saved successfully! Click Download to save your file.'}
          </p>
        </div>
      )}
    </div>
  );
}
