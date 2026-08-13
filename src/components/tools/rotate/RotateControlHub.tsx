'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { CalibrationTab } from './types';
import { RotatePresetPanel, RotatePresetPanelProps } from './RotatePresetPanel';
import { RotateSteplessPanel, RotateSteplessPanelProps } from './RotateSteplessPanel';

export interface RotateControlHubProps {
  selectedPages: Set<number>;
  totalPages: number;
  calibrationTab: CalibrationTab;
  setCalibrationTab: (tab: CalibrationTab) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  presetPanelProps: RotatePresetPanelProps;
  steplessPanelProps: RotateSteplessPanelProps;
}

export function RotateControlHub({
  selectedPages,
  totalPages,
  calibrationTab,
  setCalibrationTab,
  onSelectAll,
  onClearSelection,
  presetPanelProps,
  steplessPanelProps,
}: RotateControlHubProps) {
  const t = useTranslations('tools');
  const tCommon = useTranslations('common');

  return (
    <Card
      variant="default"
      className="backdrop-blur-md border border-white/20 dark:border-zinc-800/40 shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-[hsl(var(--color-border))]">
        <h3 className="text-lg font-bold tracking-tight text-[hsl(var(--color-foreground))] flex items-center gap-2">
          <svg className="w-5 h-5 text-[hsl(var(--color-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t('rotate.optionsTitle')}
        </h3>
        <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-1">
          {t('rotate.optionsHelp')}
        </p>
      </div>

      {/* Selection Summary Block */}
      <div className="px-5 py-3 bg-[hsl(var(--color-muted)/0.3)] border-b border-[hsl(var(--color-border))] flex items-center justify-between">
        <span className="text-xs font-semibold text-[hsl(var(--color-foreground))]">
          {t('rotate.selectedPages', { selected: selectedPages.size, total: totalPages })}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={onSelectAll}
            className="text-[10px] px-2 py-1 rounded bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-muted))] text-[hsl(var(--color-foreground))] font-medium transition-colors"
          >
            {tCommon('buttons.selectAll')}
          </button>
          <button
            onClick={onClearSelection}
            className="text-[10px] px-2 py-1 rounded bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-muted))] text-[hsl(var(--color-foreground))] font-medium transition-colors"
          >
            {tCommon('buttons.clear')}
          </button>
        </div>
      </div>

      {/* Tabs Panel */}
      <div className="p-5 space-y-6">
        {/* Mode Selector Tab buttons */}
        <div className="flex bg-[hsl(var(--color-muted)/0.5)] p-1 rounded-[var(--radius-md)]">
          <button
            onClick={() => setCalibrationTab('preset')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all ${calibrationTab === 'preset'
                ? 'bg-[hsl(var(--card-background, var(--color-card)))] text-[hsl(var(--color-foreground))] shadow-sm'
                : 'text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]'
              }`}
          >
            {t('rotate.quickRotate')}
          </button>
          <button
            onClick={() => setCalibrationTab('stepless')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all ${calibrationTab === 'stepless'
                ? 'bg-[hsl(var(--card-background, var(--color-card)))] text-[hsl(var(--color-foreground))] shadow-sm'
                : 'text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]'
              }`}
          >
            {t('rotate.fineRotate')}
          </button>
        </div>

        {/* TAB 1: PRESET ROTATION PANEL */}
        {calibrationTab === 'preset' && (
          <RotatePresetPanel {...presetPanelProps} />
        )}

        {/* TAB 2: STEPLESS STEP ROTATION (FINE GRAIN DIAL + SLIDER) */}
        {calibrationTab === 'stepless' && (
          <RotateSteplessPanel {...steplessPanelProps} />
        )}
      </div>
    </Card>
  );
}
