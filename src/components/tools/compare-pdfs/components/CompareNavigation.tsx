import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Maximize2, Minimize } from 'lucide-react';
import type { PageComparisonResult } from '../types';

interface CompareNavigationProps {
  currentPairIdx: number;
  totalPairs: number;
  currentPair: PageComparisonResult | undefined;
  isFullscreen: boolean;
  onPrevPair: () => void;
  onNextPair: () => void;
  onToggleFullscreen: () => void;
}

export function CompareNavigation({
  currentPairIdx,
  totalPairs,
  currentPair,
  isFullscreen,
  onPrevPair,
  onNextPair,
  onToggleFullscreen
}: CompareNavigationProps) {
  const t = useTranslations('common');

  return (
    <div className="flex items-center justify-between px-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevPair}
        disabled={currentPairIdx === 0}
        className="flex items-center gap-1 py-2"
      >
        <ChevronLeft className="w-4 h-4" />
        {t('comparePdfs.prevPair')}
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[hsl(var(--color-foreground))]">
          {t('comparePdfs.alignSequence', { current: currentPairIdx + 1, total: totalPairs })}
        </span>
        {currentPair && (
          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
              currentPair.hasDifference
                ? 'bg-red-500/15 text-red-500 border border-red-500/25'
                : 'bg-green-500/15 text-green-500 border border-green-500/25'
            }`}
          >
            {currentPair.pageIndex1 === -1 && t('comparePdfs.insertedPage')}
            {currentPair.pageIndex2 === -1 && t('comparePdfs.deletedPage')}
            {currentPair.pageIndex1 !== -1 &&
              currentPair.pageIndex2 !== -1 &&
              (currentPair.hasDifference
                ? t('comparePdfs.diffPercentage', { percent: currentPair.diffPercentage.toFixed(1) })
                : t('comparePdfs.noDiff'))}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFullscreen}
          className="p-2"
          title={t('comparePdfs.fullscreenTooltip')}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextPair}
          disabled={currentPairIdx >= totalPairs - 1}
          className="flex items-center gap-1 py-2"
        >
          {t('comparePdfs.nextPair')}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
