'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { addPageNumbers, type PageNumberOptions } from '@/lib/pdf/processors/page-numbers';
import { usePdfProcessing } from '@/hooks/usePdfProcessing';
import { usePdfPreview } from '@/hooks/usePdfPreview';
import { PageNumbersOptions } from './PageNumbersOptions';
import { PageNumbersPreview } from './PageNumbersPreview';
import { DEFAULT_PAGE_NUMBERS_CONFIG, type PageNumbersConfig } from './types';

export interface PageNumbersToolProps {
  className?: string;
}

export function PageNumbersTool({ className = '' }: PageNumbersToolProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools');

  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<PageNumbersConfig>(DEFAULT_PAGE_NUMBERS_CONFIG);

  const {
    status,
    progress,
    progressMessage,
    result,
    error: processingError,
    isProcessing,
    execute,
    cancel,
    reset: resetProcessing,
    setError,
  } = usePdfProcessing();

  const {
    totalPages,
    currentPage,
    setCurrentPage,
    error: previewError,
    renderPageToCanvas,
  } = usePdfPreview(file);

  const handleUpdateConfig = useCallback((updater: Partial<PageNumbersConfig>) => {
    setConfig((prev) => ({ ...prev, ...updater }));
  }, []);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        setFile(files[0]);
        resetProcessing();
      }
    },
    [resetProcessing]
  );

  const handleClearFile = useCallback(() => {
    setFile(null);
    resetProcessing();
  }, [resetProcessing]);

  const handleProcess = useCallback(async () => {
    if (!file) return;

    const options: PageNumberOptions = {
      position: config.position,
      format: config.format as PageNumberOptions['format'],
      startNumber: config.startNumber,
      fontSize: config.fontSize,
      fontColor: config.fontColor,
      margin: config.margin,
      skipFirstPage: config.skipFirstPage,
      prefix: config.prefix,
      suffix: config.suffix,
      customFormat: config.format === 'custom' ? config.customFormat : undefined,
      pageMode: config.pageMode,
      oddPosition: config.oddPosition,
      evenPosition: config.evenPosition,
    };

    await execute((onProgress) => addPageNumbers(file, options, onProgress));
  }, [file, config, execute]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeError = processingError || previewError;

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
          label={tTools('pageNumbers.uploadLabel')}
          description={tTools('pageNumbers.uploadDescription')}
        />
      )}

      {activeError && (
        <div className="p-4 rounded-[var(--radius-md)] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          <p className="text-sm">{activeError}</p>
        </div>
      )}

      {file && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Left Panel: File Info + Options */}
          <div className="space-y-3 lg:max-h-[850px] lg:overflow-y-auto lg:pr-2">
            <Card variant="outlined" className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-8 h-8 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                      {formatSize(file.size)} • {totalPages} pages
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearFile} disabled={isProcessing}>
                  {t('buttons.remove')}
                </Button>
              </div>
            </Card>

            <PageNumbersOptions
              config={config}
              onChange={handleUpdateConfig}
              disabled={isProcessing}
            />
          </div>

          {/* Right Panel: Live Canvas Preview */}
          <div>
            <PageNumbersPreview
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              renderPageToCanvas={renderPageToCanvas}
              config={config}
            />
          </div>
        </div>
      )}

      {isProcessing && (
        <ProcessingProgress
          progress={progress}
          status={status}
          message={progressMessage}
          onCancel={cancel}
          showPercentage
        />
      )}

      {file && (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleProcess}
            disabled={!file || isProcessing}
            loading={isProcessing}
          >
            {isProcessing ? t('status.processing') : tTools('pageNumbers.addButton')}
          </Button>
          {result && (
            <DownloadButton
              file={result}
              filename={file.name.replace('.pdf', '_numbered.pdf')}
              variant="secondary"
              size="lg"
              showFileSize
            />
          )}
        </div>
      )}

      {status === 'complete' && result && (
        <div className="p-4 rounded-[var(--radius-md)] bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
          <p className="text-sm font-medium">{tTools('pageNumbers.successMessage')}</p>
        </div>
      )}
    </div>
  );
}

export default PageNumbersTool;
