import React from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../../FileUploader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FileText, Shuffle } from 'lucide-react';
import type { PDFFile } from '../types';

interface CompareFileUploaderProps {
  file1: PDFFile | null;
  file2: PDFFile | null;
  isProcessing: boolean;
  onFile1Selected: (files: File[]) => void;
  onFile2Selected: (files: File[]) => void;
  onRemoveFile1: () => void;
  onRemoveFile2: () => void;
  onCompare: () => void;
  onError: (msg: string | null) => void;
  hasResults: boolean;
}

export function CompareFileUploader({
  file1,
  file2,
  isProcessing,
  onFile1Selected,
  onFile2Selected,
  onRemoveFile1,
  onRemoveFile2,
  onCompare,
  onError,
  hasResults
}: CompareFileUploaderProps) {
  const t = useTranslations('common');

  return (
    <div className="space-y-6">
      {!hasResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File 1 Slot */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-[hsl(var(--color-foreground))] block">
              {t('comparePdfs.originalPdfTitle')}
            </label>
            {file1 ? (
              <Card
                variant="outlined"
                className="p-4 flex items-center justify-between border-2 border-[hsl(var(--color-primary)/0.35)] bg-[hsl(var(--color-muted)/0.15)] rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-10 h-10 text-[hsl(var(--color-primary))]" />
                  <div>
                    <p className="font-semibold text-sm truncate max-w-[200px]" title={file1.file.name}>
                      {file1.file.name}
                    </p>
                    <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                      {file1.pageCount} {t('pdfToCbz.pagesLabel') || 'pages'} • {(file1.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onRemoveFile1}>
                  {t('comparePdfs.removeButton')}
                </Button>
              </Card>
            ) : (
              <FileUploader
                accept={['application/pdf']}
                multiple={false}
                onFilesSelected={onFile1Selected}
                onError={onError}
                disabled={isProcessing}
                label={t('comparePdfs.originalPdfLabel')}
                description={t('comparePdfs.originalPdfDesc')}
                className="min-h-[160px] p-6 rounded-2xl"
              />
            )}
          </div>

          {/* File 2 Slot */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-[hsl(var(--color-foreground))] block">
              {t('comparePdfs.modifiedPdfTitle')}
            </label>
            {file2 ? (
              <Card
                variant="outlined"
                className="p-4 flex items-center justify-between border-2 border-emerald-500/35 bg-emerald-500/5 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-10 h-10 text-emerald-500" />
                  <div>
                    <p className="font-semibold text-sm truncate max-w-[200px]" title={file2.file.name}>
                      {file2.file.name}
                    </p>
                    <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                      {file2.pageCount} {t('pdfToCbz.pagesLabel') || 'pages'} • {(file2.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onRemoveFile2}>
                  {t('comparePdfs.removeButton')}
                </Button>
              </Card>
            ) : (
              <FileUploader
                accept={['application/pdf']}
                multiple={false}
                onFilesSelected={onFile2Selected}
                onError={onError}
                disabled={isProcessing}
                label={t('comparePdfs.modifiedPdfLabel')}
                description={t('comparePdfs.modifiedPdfDesc')}
                className="min-h-[160px] p-6 rounded-2xl border-emerald-500/20 hover:border-emerald-500"
              />
            )}
          </div>
        </div>
      )}

      {/* Start compare button */}
      {file1 && file2 && !hasResults && !isProcessing && (
        <div className="flex justify-center pt-3">
          <Button
            variant="primary"
            size="lg"
            onClick={onCompare}
            className="px-12 py-4 font-bold shadow-lg shadow-[hsl(var(--color-primary)/0.15)] flex items-center gap-2"
          >
            <Shuffle className="w-5 h-5 animate-pulse" />
            {t('comparePdfs.startCompare')}
          </Button>
        </div>
      )}
    </div>
  );
}
