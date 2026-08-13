import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextMatch } from '@/lib/pdf/processors/find-and-redact';
import { MatchStats } from '../types';

interface MatchListProps {
    totalMatchesCount: number;
    filteredMatches: TextMatch[];
    matchStats: MatchStats;
    selectedPage: number | 'all';
    previewPage?: number;
    showPreview: boolean;
    disabled: boolean;
    onToggleMatchSelection: (matchId: string) => void;
    onToggleSelectAll: (selected: boolean) => void;
    onSelectPageFilter: (page: number | 'all') => void;
    onPreviewPageChange?: (page: number) => void;
}

export function MatchList({
    totalMatchesCount,
    filteredMatches,
    matchStats,
    selectedPage,
    previewPage,
    showPreview,
    disabled,
    onToggleMatchSelection,
    onToggleSelectAll,
    onSelectPageFilter,
    onPreviewPageChange,
}: MatchListProps) {
    const t = useTranslations('common');
    const tTools = useTranslations('tools.findAndRedact');

    return (
        <Card variant="outlined" size="lg" className={showPreview ? 'h-full' : ''}>
            {/* Matches Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {tTools('matchesFound', { count: totalMatchesCount })}
                </h3>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleSelectAll(true)}
                        disabled={disabled}
                    >
                        {t('buttons.selectAll')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleSelectAll(false)}
                        disabled={disabled}
                    >
                        {t('buttons.deselectAll')}
                    </Button>
                </div>
            </div>

            {/* Page Filter Tabs */}
            {matchStats.pagesWithMatches.length > 1 && (
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => onSelectPageFilter('all')}
                            className={`px-2 py-1 text-xs rounded-full border transition-all ${selectedPage === 'all'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                }`}
                            disabled={disabled}
                        >
                            {tTools('allMatches', { count: totalMatchesCount })}
                        </button>
                        {matchStats.pagesWithMatches.map(page => {
                            const pageMatchCount = matchStats.pageCounts.get(page) ?? 0;
                            const isSelected = selectedPage === page;
                            return (
                                <button
                                    key={page}
                                    onClick={() => {
                                        onSelectPageFilter(page);
                                        if (onPreviewPageChange) {
                                            onPreviewPageChange(page);
                                        }
                                    }}
                                    className={`px-2 py-1 text-xs rounded-full border transition-all ${isSelected
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                        }`}
                                    disabled={disabled}
                                >
                                    P{page} ({pageMatchCount})
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Matches List */}
            <div
                className="border rounded-lg divide-y dark:border-gray-700 dark:divide-gray-700 overflow-y-auto"
                style={{
                    maxHeight: showPreview ? 'calc(100vh - 380px)' : '240px',
                    minHeight: showPreview ? '300px' : 'auto',
                }}
            >
                {filteredMatches.map((match) => (
                    <div
                        key={match.id}
                        className={`flex items-center gap-2.5 p-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${match.selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            } ${previewPage === match.page ? 'border-l-2 border-l-blue-500' : ''}`}
                    >
                        <input
                            type="checkbox"
                            checked={match.selected}
                            onChange={() => onToggleMatchSelection(match.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0"
                            disabled={disabled}
                        />
                        <div
                            className="flex-1 min-w-0"
                            onClick={() => {
                                if (onPreviewPageChange) {
                                    onPreviewPageChange(match.page);
                                }
                                onSelectPageFilter(match.page);
                            }}
                        >
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                "{match.text}"
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {tTools('pageInfo', { page: match.page })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {tTools('selectedCount', { selected: matchStats.selectedCount, total: totalMatchesCount })}
            </p>
        </Card>
    );
}
