import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Filter } from 'lucide-react';
import type { PageComparisonResult, FilterPills } from '../types';

interface CompareHeaderPanelProps {
  pairedPages: PageComparisonResult[];
  filterPills: FilterPills;
  onToggleFilter: (key: keyof FilterPills) => void;
  onReset: () => void;
}

export function CompareHeaderPanel({
  pairedPages,
  filterPills,
  onToggleFilter,
  onReset
}: CompareHeaderPanelProps) {
  const t = useTranslations('common');

  const diffCount = pairedPages.filter(p => p.hasDifference).length;

  return (
    <Card
      variant="default"
      className="p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md bg-white/40 dark:bg-black/35 border border-white/20 dark:border-zinc-800/40"
    >
      <div>
        <h3 className="text-md font-bold text-[hsl(var(--color-foreground))]">
          {t('comparePdfs.successTitle')}
        </h3>
        <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-1">
          {t('comparePdfs.totalAligned', { count: pairedPages.length })} •{' '}
          {t.rich('comparePdfs.diffSummary', {
            count: diffCount,
            red: chunks => <span className="font-bold text-red-500 mx-1">{chunks}</span>
          })}
        </p>
      </div>

      {/* Filter pills bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black text-zinc-400 flex items-center gap-1 uppercase tracking-wider mr-2">
          <Filter className="w-3.5 h-3.5" />
          {t('comparePdfs.filterLabel')}
        </span>

        <button
          onClick={() => onToggleFilter('text')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            filterPills.text
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/35 shadow-sm shadow-amber-500/5'
              : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 border border-transparent'
          }`}
        >
          {t('comparePdfs.filterText')}
        </button>

        <button
          onClick={() => onToggleFilter('formatting')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            filterPills.formatting
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/35 shadow-sm shadow-emerald-500/5'
              : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 border border-transparent'
          }`}
        >
          {t('comparePdfs.filterFont')}
        </button>

        <button
          onClick={() => onToggleFilter('headerFooter')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            filterPills.headerFooter
              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/35 shadow-sm shadow-blue-500/5'
              : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 border border-transparent'
          }`}
        >
          {t('comparePdfs.filterHeaderFooter')}
        </button>

        <button
          onClick={() => onToggleFilter('moved')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            filterPills.moved
              ? 'bg-purple-500/10 text-purple-500 border border-purple-500/35 shadow-sm shadow-purple-500/5'
              : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 border border-transparent'
          }`}
        >
          {t('comparePdfs.filterMoved')}
        </button>

        <Button variant="outline" size="sm" onClick={onReset} className="ml-4 py-2 text-xs">
          {t('comparePdfs.resetButton')}
        </Button>
      </div>
    </Card>
  );
}
