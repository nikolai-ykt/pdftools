'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatFileSize } from '@/lib/utils/formatFileSize';

import type { WatermarkToolProps } from './types';
export type { WatermarkToolProps };
import { useWatermark } from './useWatermark';
import { useWatermarkPreview } from './useWatermarkPreview';
import { WatermarkTypeSelector } from './WatermarkTypeSelector';
import { TextWatermarkSettings } from './TextWatermarkSettings';
import { ImageWatermarkSettings } from './ImageWatermarkSettings';
import { RepeatWatermarkSettings } from './RepeatWatermarkSettings';
import { PageRangeSettings } from './PageRangeSettings';
import { WatermarkPreview } from './WatermarkPreview';

export function WatermarkTool({ className = '' }: WatermarkToolProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools.watermark');

  const {
    file,
    status,
    progress,
    progressMessage,
    result,
    error,
    totalPages,
    settings,
    pageSettings,
    setError,
    selectFile,
    clearFile,
    updateSettings,
    updatePageSettings,
    process,
    cancel,
  } = useWatermark();

  const { previewUrl, isPreviewing } = useWatermarkPreview({
    file,
    settings,
    pageSettings,
    totalPages,
  });

  const isProcessing = status === 'processing';
  const isProcessDisabled =
    !file ||
    isProcessing ||
    (settings.type === 'text' && !settings.text.trim()) ||
    (settings.type === 'image' && !settings.imageFile);

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {!file && (
        <FileUploader
          accept={['application/pdf', '.pdf']}
          multiple={false}
          maxFiles={1}
          onFilesSelected={selectFile}
          onError={setError}
          disabled={isProcessing}
          label={tTools('uploadLabel')}
          description={tTools('uploadDescription')}
        />
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {file && (
        <div className="grid grid-cols-1 lg:grid-cols-[570px_1fr] gap-6">
          <div className="space-y-6">
            {/* File Info Card */}
            <Card variant="outlined">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFile} disabled={isProcessing}>
                  {t('buttons.remove')}
                </Button>
              </div>
            </Card>

            {/* Watermark Configuration Card */}
            <Card variant="outlined" size="lg">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                {tTools('optionsTitle')}
              </h3>

              <WatermarkTypeSelector
                value={settings.type}
                onChange={(type) => updateSettings('type', type)}
                disabled={isProcessing}
              />

              {settings.type === 'text' ? (
                <TextWatermarkSettings
                  settings={settings}
                  onChange={updateSettings}
                  disabled={isProcessing}
                />
              ) : (
                <ImageWatermarkSettings
                  settings={settings}
                  onChange={updateSettings}
                  onError={setError}
                  disabled={isProcessing}
                />
              )}
            </Card>

            {/* Repeat Watermark Card */}
            <RepeatWatermarkSettings
              settings={settings}
              onChange={updateSettings}
              disabled={isProcessing}
            />

            {/* Page Range Card */}
            <PageRangeSettings
              settings={pageSettings}
              onChange={updatePageSettings}
              disabled={isProcessing}
            />

            {/* Actions & Progress */}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => process(tTools)}
                disabled={isProcessDisabled}
                loading={isProcessing}
              >
                {isProcessing ? t('status.processing') : tTools('addButton')}
              </Button>
              {result && (
                <DownloadButton
                  file={result}
                  filename={file.name.replace('.pdf', '_watermarked.pdf')}
                  variant="secondary"
                  size="lg"
                  showFileSize
                />
              )}
            </div>

            {isProcessing && (
              <ProcessingProgress
                progress={progress}
                status={status}
                message={progressMessage}
                onCancel={cancel}
                showPercentage
              />
            )}

            {status === 'complete' && result && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                <p className="text-sm font-medium">{tTools('successMessage')}</p>
              </div>
            )}
          </div>

          {/* Live Preview Panel */}
          <WatermarkPreview url={previewUrl} loading={isPreviewing} />
        </div>
      )}
    </div>
  );
}

export default WatermarkTool;
