import React from 'react';
import { useTranslations } from 'next-intl';
import type { BookmarkInfo } from '@/lib/pdf';
import type { SplitMode } from './utils/calculateSplitRanges';
import { BookmarkList } from './BookmarkList';
import { EveryPageIcon, VisualSelectIcon } from './icons/SplitIcons';

export interface SplitModeOptionsProps {
  splitMode: SplitMode;
  totalPages: number;
  isProcessing: boolean;
  // Ranges mode
  rangeInput: string;
  onRangeInputChange: (val: string) => void;
  // Even-odd mode
  evenOddMode: 'odd' | 'even' | 'both';
  onEvenOddModeChange: (mode: 'odd' | 'even' | 'both') => void;
  // Bookmarks mode
  bookmarks: BookmarkInfo[];
  // N-times mode
  splitCount: number;
  onSplitCountChange: (count: number) => void;
}

export function SplitModeOptions({
  splitMode,
  totalPages,
  isProcessing,
  rangeInput,
  onRangeInputChange,
  evenOddMode,
  onEvenOddModeChange,
  bookmarks,
  splitCount,
  onSplitCountChange,
}: SplitModeOptionsProps) {
  const tTools = useTranslations('tools');

  return (
    <div className="mt-4">
      {splitMode === 'ranges' && (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="page-ranges"
              className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1"
            >
              {tTools('splitPdf.rangeInputLabel') || 'Page Ranges'}
            </label>
            <input
              id="page-ranges"
              type="text"
              value={rangeInput}
              onChange={(e) => onRangeInputChange(e.target.value)}
              placeholder="e.g., 1-5, 8, 10-15"
              disabled={isProcessing}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
            />
            <p className="mt-1 text-xs text-[hsl(var(--color-muted-foreground))]">
              {tTools('splitPdf.rangeInputHint') ||
                'Enter page numbers or ranges separated by commas. Leave empty to export all pages as one file.'}
            </p>
          </div>
        </div>
      )}

      {splitMode === 'even-odd' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-2">
              {tTools('splitPdf.evenOddLabel') || 'Extract Pages'}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEvenOddModeChange('odd')}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                  evenOddMode === 'odd'
                    ? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))]'
                    : 'bg-[hsl(var(--color-muted))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted)/0.8)]'
                }`}
              >
                {tTools('splitPdf.oddPagesOnly') || 'Odd Pages Only'}
              </button>
              <button
                type="button"
                onClick={() => onEvenOddModeChange('even')}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                  evenOddMode === 'even'
                    ? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))]'
                    : 'bg-[hsl(var(--color-muted))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted)/0.8)]'
                }`}
              >
                {tTools('splitPdf.evenPagesOnly') || 'Even Pages Only'}
              </button>
              <button
                type="button"
                onClick={() => onEvenOddModeChange('both')}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                  evenOddMode === 'both'
                    ? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))]'
                    : 'bg-[hsl(var(--color-muted))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted)/0.8)]'
                }`}
              >
                {tTools('splitPdf.bothSeparate') || 'Both (Separate Files)'}
              </button>
            </div>
            <p className="mt-2 text-xs text-[hsl(var(--color-muted-foreground))]">
              {tTools('splitPdf.evenOddHint') || 'Odd pages: 1, 3, 5... Even pages: 2, 4, 6...'}
            </p>
          </div>
        </div>
      )}

      {splitMode === 'every-page' && (
        <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <EveryPageIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">{totalPages} Separate Files</p>
              <p className="text-xs text-blue-600 mt-0.5">
                {tTools('splitPdf.everyPageInfo', { count: totalPages }) ||
                  'Each page will be extracted as a separate PDF file'}
              </p>
            </div>
          </div>
        </div>
      )}

      {splitMode === 'visual' && (
        <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200/60 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <VisualSelectIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-800">Visual Page Selection</p>
              <p className="text-xs text-purple-600 mt-0.5">
                {tTools('splitPdf.visualInfo') ||
                  'Click on page thumbnails below to select pages for extraction'}
              </p>
            </div>
          </div>
        </div>
      )}

      {splitMode === 'bookmarks' && <BookmarkList bookmarks={bookmarks} />}

      {splitMode === 'n-times' && (
        <div>
          <label
            htmlFor="split-count"
            className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-1"
          >
            {tTools('splitPdf.splitCountLabel') || 'Number of Parts'}
          </label>
          <input
            id="split-count"
            type="number"
            min={2}
            max={totalPages}
            value={splitCount}
            onChange={(e) =>
              onSplitCountChange(
                Math.max(2, Math.min(totalPages, parseInt(e.target.value, 10) || 2))
              )
            }
            disabled={isProcessing}
            className="w-24 px-3 py-2 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
          />
          <p className="mt-1 text-xs text-[hsl(var(--color-muted-foreground))]">
            {tTools('splitPdf.splitCountHint', {
              count: splitCount,
              pages: Math.ceil(totalPages / splitCount),
            }) ||
              `Split into ${splitCount} equal parts (~${Math.ceil(
                totalPages / splitCount
              )} pages each)`}
          </p>
        </div>
      )}
    </div>
  );
}
