'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export interface RotatePresetPanelProps {
  selectedPages: Set<number>;
  isProcessing: boolean;
  hasRotations: boolean;
  customPageInput: string;
  setCustomPageInput: (value: string) => void;
  onApplyPresetRotation: (angle: number) => void;
  onResetAll: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
  onApplyCustomPages: () => void;
}

export function RotatePresetPanel({
  selectedPages,
  isProcessing,
  hasRotations,
  customPageInput,
  setCustomPageInput,
  onApplyPresetRotation,
  onResetAll,
  onSelectOdd,
  onSelectEven,
  onApplyCustomPages,
}: RotatePresetPanelProps) {
  const t = useTranslations('tools');

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onApplyPresetRotation(-90)}
          disabled={isProcessing || selectedPages.size === 0}
          className="py-3 flex flex-col items-center gap-1.5 text-xs font-medium"
        >
          <svg className="w-5 h-5 text-[hsl(var(--color-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          {t('rotate.rotateLeft90')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onApplyPresetRotation(90)}
          disabled={isProcessing || selectedPages.size === 0}
          className="py-3 flex flex-col items-center gap-1.5 text-xs font-medium"
        >
          <svg className="w-5 h-5 text-[hsl(var(--color-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
          {t('rotate.rotateRight90')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onApplyPresetRotation(180)}
          disabled={isProcessing || selectedPages.size === 0}
          className="py-3 flex flex-col items-center gap-1.5 text-xs font-medium"
        >
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17.5" />
          </svg>
          {t('rotate.rotate180')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetAll}
          disabled={isProcessing || !hasRotations}
          className="py-3 flex flex-col items-center gap-1.5 text-xs font-medium border border-dashed border-[hsl(var(--color-border))]"
        >
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {t('rotate.resetRotate')}
        </Button>
      </div>

      {/* Pre-defined Range Selection Quick Filters */}
      <div className="pt-2 border-t border-[hsl(var(--color-border))]">
        <p className="text-[11px] font-semibold text-[hsl(var(--color-muted-foreground))] mb-2">
          {t('rotate.quickSelectLabel')}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onSelectOdd}
            className="flex-1 text-[11px] py-1 rounded bg-[hsl(var(--color-muted))] hover:bg-[hsl(var(--color-muted-foreground)/0.2)] text-[hsl(var(--color-foreground))] transition-colors font-medium"
          >
            {t('rotate.selectOdd')}
          </button>
          <button
            type="button"
            onClick={onSelectEven}
            className="flex-1 text-[11px] py-1 rounded bg-[hsl(var(--color-muted))] hover:bg-[hsl(var(--color-muted-foreground)/0.2)] text-[hsl(var(--color-foreground))] transition-colors font-medium"
          >
            {t('rotate.selectEven')}
          </button>
        </div>
        <div className="mt-2 flex gap-1.5">
          <input
            type="text"
            value={customPageInput}
            onChange={(e) => setCustomPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onApplyCustomPages();
              }
            }}
            placeholder="e.g. 1, 3-5"
            className="flex-1 text-[11px] px-2 py-1 rounded bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-muted-foreground))]/50 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-primary))]"
          />
          <button
            type="button"
            onClick={onApplyCustomPages}
            disabled={!customPageInput.trim()}
            className="text-[11px] px-3 py-1 rounded bg-[hsl(var(--color-primary))] text-white hover:bg-[hsl(var(--color-primary))/0.9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
