import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DownloadButton } from '../DownloadButton';
import { createZip } from '@/lib/zip';
import { formatFileSize } from '@/lib/pdf';
import type { SplitResultItem } from './hooks/usePdfSplitter';
import { PdfIcon, ZipIcon } from './icons/SplitIcons';

export interface SplitResultsProps {
  results: SplitResultItem[];
  originalFileName?: string;
  onError: (error: string) => void;
}

export function SplitResults({ results, originalFileName, onError }: SplitResultsProps) {
  const tTools = useTranslations('tools');
  const [isZipping, setIsZipping] = useState(false);

  if (results.length === 0) return null;

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zipBlob = await createZip(results);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      const zipBaseName = originalFileName ? originalFileName.replace(/\.pdf$/i, '') : 'split';
      link.download = `${zipBaseName}-files.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      onError('Failed to create ZIP file.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card variant="outlined" size="lg">
        <h3 className="text-lg font-medium text-[hsl(var(--color-foreground))] mb-4">
          {tTools('splitPdf.resultsTitle') || 'Split Results'} ({results.length}{' '}
          {results.length === 1 ? 'file' : 'files'})
        </h3>

        {/* Download ZIP button if multiple files */}
        {results.length > 1 && (
          <div className="mb-4">
            <Button
              variant="primary"
              onClick={handleDownloadZip}
              loading={isZipping}
              className="w-full sm:w-auto"
            >
              <ZipIcon />
              {tTools('splitPdf.downloadZip') || 'Download All as ZIP'}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[hsl(var(--color-muted)/0.3)]"
            >
              <div className="flex items-center gap-3">
                <PdfIcon className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">
                    {result.filename}
                  </p>
                  <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                    {formatFileSize(result.blob.size)}
                  </p>
                </div>
              </div>
              <DownloadButton
                file={result.blob}
                filename={result.filename}
                variant="secondary"
                size="sm"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Success Message */}
      <div
        className="p-4 rounded-[var(--radius-md)] bg-green-50 border border-green-200 text-green-700"
        role="status"
      >
        <p className="text-sm font-medium">
          {tTools('splitPdf.successMessage') ||
            `PDF split successfully into ${results.length} file(s)! Click the download buttons to save your files.`}
        </p>
      </div>
    </div>
  );
}
