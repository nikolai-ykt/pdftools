'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { PagePreview } from './types';
import { RotatePageCard } from './RotatePageCard';

export interface RotatePreviewGridProps {
  pagePreviews: PagePreview[];
  selectedPages: Set<number>;
  isLoadingPreviews: boolean;
  isProcessing: boolean;
  onToggleSelectPage: (pageNum: number) => void;
  onRotatePage: (pageNumbers: number[], angleUpdater: (current: number) => number) => void;
}

export function RotatePreviewGrid({
  pagePreviews,
  selectedPages,
  isLoadingPreviews,
  isProcessing,
  onToggleSelectPage,
  onRotatePage,
}: RotatePreviewGridProps) {
  const t = useTranslations('tools');

  return (
    <div className="lg:col-span-8 space-y-4">
      <div className="flex items-center justify-between bg-[hsl(var(--color-card))] px-4 py-3 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--color-primary))] animate-pulse" />
          <span className="text-sm font-semibold text-[hsl(var(--color-foreground))]">{t('rotate.previewTitle')}</span>
        </div>
        <span className="text-xs text-[hsl(var(--color-muted-foreground))]">
          {t('rotate.previewHelp')}
        </span>
      </div>

      {isLoadingPreviews ? (
        <div className="flex items-center justify-center py-32 bg-[hsl(var(--color-card))] rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[hsl(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-[hsl(var(--color-muted-foreground))]">
              {t('rotate.loadingPreview')}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[hsl(var(--color-card))] rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] p-5 max-h-[640px] overflow-y-auto shadow-inner">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
            {pagePreviews.map((preview) => (
              <RotatePageCard
                key={preview.pageNumber}
                preview={preview}
                isSelected={selectedPages.has(preview.pageNumber)}
                isProcessing={isProcessing}
                onToggleSelect={onToggleSelectPage}
                onRotatePage={onRotatePage}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
