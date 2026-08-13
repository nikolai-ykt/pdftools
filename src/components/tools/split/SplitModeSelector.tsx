import React from 'react';
import { useTranslations } from 'next-intl';
import type { SplitMode } from './utils/calculateSplitRanges';
import {
  RangeIcon,
  EvenOddIcon,
  EveryPageIcon,
  VisualSelectIcon,
  BookmarkIcon,
  SplitNTimesIcon,
  CheckIcon,
} from './icons/SplitIcons';

export interface SplitModeSelectorProps {
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
  disabled?: boolean;
  bookmarkCount?: number;
}

interface SplitModeItem {
  id: SplitMode;
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export function SplitModeSelector({
  value,
  onChange,
  disabled = false,
  bookmarkCount = 0,
}: SplitModeSelectorProps) {
  const tTools = useTranslations('tools');

  const SPLIT_MODES: SplitModeItem[] = [
    {
      id: 'ranges',
      labelKey: 'splitPdf.modeRanges',
      defaultLabel: 'Page Range',
      icon: RangeIcon,
    },
    {
      id: 'even-odd',
      labelKey: 'splitPdf.modeEvenOdd',
      defaultLabel: 'Even/Odd',
      icon: EvenOddIcon,
    },
    {
      id: 'every-page',
      labelKey: 'splitPdf.modeEveryPage',
      defaultLabel: 'Every Page',
      icon: EveryPageIcon,
    },
    {
      id: 'visual',
      labelKey: 'splitPdf.modeVisualShort',
      defaultLabel: 'Visual Select',
      icon: VisualSelectIcon,
    },
    {
      id: 'bookmarks',
      labelKey: 'splitPdf.modeBookmarksShort',
      defaultLabel: 'Bookmarks',
      icon: BookmarkIcon,
      badgeCount: bookmarkCount,
    },
    {
      id: 'n-times',
      labelKey: 'splitPdf.modeNTimesShort',
      defaultLabel: 'Split N Parts',
      icon: SplitNTimesIcon,
    },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-3">
        {tTools('splitPdf.splitModeLabel') || 'Split Mode'}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {SPLIT_MODES.map((mode) => {
          const isSelected = value === mode.id;
          const Icon = mode.icon;
          const label = tTools(mode.labelKey)
            ?.replace(' (Default)', '')
            ?.replace('Split by ', '')
            ?.replace('Split All Pages into Separate Files', 'Every Page')
            || mode.defaultLabel;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              disabled={disabled}
              className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary)/0.05)] shadow-md'
                  : 'border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-primary)/0.5)] hover:bg-[hsl(var(--color-muted)/0.3)]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                  isSelected
                    ? 'bg-[hsl(var(--color-primary))] text-white'
                    : 'bg-[hsl(var(--color-muted))] text-[hsl(var(--color-muted-foreground))] group-hover:bg-[hsl(var(--color-primary)/0.2)]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <span
                className={`text-sm font-medium text-center ${
                  isSelected
                    ? 'text-[hsl(var(--color-primary))]'
                    : 'text-[hsl(var(--color-foreground))]'
                }`}
              >
                {label}
              </span>

              {Boolean(mode.badgeCount && mode.badgeCount > 0) && (
                <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                  {mode.badgeCount}
                </span>
              )}

              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[hsl(var(--color-primary))] flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
