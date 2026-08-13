'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { PagePreview } from './types';

export interface RotatePageCardProps {
  preview: PagePreview;
  isSelected: boolean;
  isProcessing: boolean;
  onToggleSelect: (pageNumber: number) => void;
  onRotatePage: (pageNumbers: number[], angleUpdater: (current: number) => number) => void;
}

export function RotatePageCard({
  preview,
  isSelected,
  isProcessing,
  onToggleSelect,
  onRotatePage,
}: RotatePageCardProps) {
  const t = useTranslations('tools');
  const isRotated = preview.rotation !== 0;

  return (
    <div
      onClick={() => onToggleSelect(preview.pageNumber)}
      className={`group relative flex flex-col items-center rounded-[var(--radius-lg)] border-2 bg-[hsl(var(--color-muted)/0.25)] overflow-hidden transition-all duration-300 cursor-pointer select-none ${isSelected
          ? 'border-[hsl(var(--color-primary))] shadow-[0_0_12px_hsl(var(--color-primary)/0.2)]'
          : 'border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-muted-foreground)/0.4)]'
        }`}
    >
      {/* Selection Checkbox corner Badge */}
      <div className={`absolute top-2.5 right-2.5 z-20 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected
          ? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] scale-100'
          : 'bg-black/40 text-transparent scale-90 group-hover:scale-100 group-hover:bg-black/60'
        }`}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Custom Fine-grain rotation degree angle Badge */}
      {isRotated && (
        <div className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-950 bg-amber-400 border border-amber-300 dark:text-amber-100 dark:bg-amber-900/80 dark:border-amber-800 rounded-md shadow-md">
          {preview.rotation > 0 ? `+${preview.rotation}` : preview.rotation}°
        </div>
      )}

      {/* Thumbnail View Frame */}
      <div className="relative aspect-[3/4] w-full p-4 flex items-center justify-center overflow-hidden bg-[hsl(var(--color-muted)/0.15)] border-b border-[hsl(var(--color-border))]">
        {/* Rotated Container applying Smooth Damping CSS Spring */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-[400ms]"
          style={{
            transform: `rotate(${preview.rotation}deg)`,
            transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Elastic bounce effect
          }}
        >
          {preview.thumbnail ? (
            <img
              src={preview.thumbnail}
              alt={`Page ${preview.pageNumber}`}
              className="max-w-full max-h-full object-contain shadow-[var(--shadow-sm)] rounded-[var(--radius-sm)] pointer-events-none"
            />
          ) : (
            <div className="w-16 h-20 rounded border border-dashed border-[hsl(var(--color-border))] flex items-center justify-center text-sm font-semibold text-[hsl(var(--color-muted-foreground))]">
              Page {preview.pageNumber}
            </div>
          )}
        </div>
      </div>

      {/* Footer details & micro quick rotation buttons */}
      <div className="w-full px-3 py-2.5 bg-[hsl(var(--color-card))] flex items-center justify-between">
        <span className="text-xs font-extrabold text-[hsl(var(--color-foreground))]">
          {t('rotate.pageNumber', { page: preview.pageNumber })}
        </span>

        {/* Micro discrete actions block */}
        <div
          className="flex items-center gap-1 z-10"
          onClick={(e) => e.stopPropagation()} // Prevent card selection toggle when clicking buttons
        >
          <button
            type="button"
            onClick={() => onRotatePage([preview.pageNumber], current => current - 90)}
            disabled={isProcessing}
            className="w-6 h-6 flex items-center justify-center rounded bg-[hsl(var(--color-muted))] hover:bg-[hsl(var(--color-muted-foreground)/0.2)] text-[hsl(var(--color-foreground))] transition-colors disabled:opacity-50"
            aria-label={`Rotate page ${preview.pageNumber} left`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onRotatePage([preview.pageNumber], current => current + 90)}
            disabled={isProcessing}
            className="w-6 h-6 flex items-center justify-center rounded bg-[hsl(var(--color-muted))] hover:bg-[hsl(var(--color-muted-foreground)/0.2)] text-[hsl(var(--color-foreground))] transition-colors disabled:opacity-50"
            aria-label={`Rotate page ${preview.pageNumber} right`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
