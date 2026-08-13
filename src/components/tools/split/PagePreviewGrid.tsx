import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { PagePreview } from './hooks/usePdfPreviews';
import { CheckIcon } from './icons/SplitIcons';

export interface PagePreviewGridProps {
  pagePreviews: PagePreview[];
  selectedPages: Set<number>;
  isLoadingPreviews: boolean;
  isProcessing: boolean;
  onTogglePage: (pageNumber: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function PagePreviewGrid({
  pagePreviews,
  selectedPages,
  isLoadingPreviews,
  isProcessing,
  onTogglePage,
  onSelectAll,
  onDeselectAll,
}: PagePreviewGridProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools');

  return (
    <Card variant="outlined" size="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-[hsl(var(--color-foreground))]">
          {tTools('splitPdf.pagePreviewTitle') || 'Select Pages'}
          {selectedPages.size > 0 && ` (${selectedPages.size} selected)`}
        </h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onSelectAll} disabled={isProcessing}>
            {t('buttons.selectAll') || 'Select All'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDeselectAll} disabled={isProcessing}>
            {t('buttons.deselectAll') || 'Deselect All'}
          </Button>
        </div>
      </div>

      {isLoadingPreviews ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
              {t('status.loading') || 'Loading previews...'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-h-[400px] overflow-y-auto p-1">
          {pagePreviews.map((preview) => {
            const isSelected = selectedPages.has(preview.pageNumber);

            return (
              <button
                key={preview.pageNumber}
                type="button"
                onClick={() => onTogglePage(preview.pageNumber)}
                disabled={isProcessing}
                className={`relative aspect-[3/4] rounded-[var(--radius-md)] border-2 overflow-hidden transition-all ${
                  isSelected
                    ? 'border-[hsl(var(--color-primary))] ring-2 ring-[hsl(var(--color-primary)/0.3)]'
                    : 'border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-primary)/0.5)]'
                }`}
                aria-label={`Page ${preview.pageNumber}${isSelected ? ' (selected)' : ''}`}
              >
                {preview.thumbnail ? (
                  <img
                    src={preview.thumbnail}
                    alt={`Page ${preview.pageNumber}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[hsl(var(--color-muted))] flex items-center justify-center">
                    <span className="text-xs text-[hsl(var(--color-muted-foreground))]">
                      {preview.pageNumber}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 text-center">
                  {preview.pageNumber}
                </div>

                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-[hsl(var(--color-primary))] rounded-full flex items-center justify-center">
                    <CheckIcon className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
