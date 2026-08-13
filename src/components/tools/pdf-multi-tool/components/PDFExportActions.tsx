import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { DownloadButton } from '../../DownloadButton';

export interface PDFExportActionsProps {
  pageCount: number;
  selectedCount: number;
  isProcessing: boolean;
  result: Blob | null;
  onDownloadSelected: () => void;
  onExport: () => void;
}

export function PDFExportActions({
  pageCount,
  selectedCount,
  isProcessing,
  result,
  onDownloadSelected,
  onExport,
}: PDFExportActionsProps) {
  const tTools = useTranslations('tools');

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center justify-between">
      <div>
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="md"
            onClick={onDownloadSelected}
            disabled={isProcessing}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {tTools('pdfMultiTool.downloadSelected') || `Download Selected (${selectedCount})`}
          </Button>
        )}
      </div>

      <div className="flex gap-3 items-center">
        {result ? (
          <DownloadButton
            file={result}
            filename="processed.pdf"
            label={tTools('pdfMultiTool.downloadPdf') || 'Download PDF'}
            variant="primary"
            size="lg"
          />
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={onExport}
            disabled={pageCount === 0 || isProcessing}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {tTools('pdfMultiTool.exportPdf') || 'Export PDF'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default React.memo(PDFExportActions);
