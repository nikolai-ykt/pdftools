import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PdfPreviewProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    previewPage: number;
    totalPages: number;
    previewScale: number;
    pagesWithMatches: number[];
    onPageChange: (page: number) => void;
    onScaleChange: (scale: number) => void;
    onSelectPageFilter: (page: number) => void;
}

export function PdfPreview({
    canvasRef,
    previewPage,
    totalPages,
    previewScale,
    pagesWithMatches,
    onPageChange,
    onScaleChange,
    onSelectPageFilter,
}: PdfPreviewProps) {
    const tTools = useTranslations('tools.findAndRedact');

    return (
        <Card variant="outlined" size="lg" className="h-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {tTools('previewTitle') || 'Preview'}
                </h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, previewPage - 1))}
                        disabled={previewPage <= 1}
                    >
                        ←
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
                        {previewPage} / {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPageChange(Math.min(totalPages, previewPage + 1))}
                        disabled={previewPage >= totalPages}
                    >
                        →
                    </Button>
                    <select
                        value={previewScale}
                        onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                        className="ml-2 px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    >
                        <option value="0.5">50%</option>
                        <option value="0.75">75%</option>
                        <option value="1">100%</option>
                        <option value="1.5">150%</option>
                        <option value="2">200%</option>
                    </select>
                </div>
            </div>

            {/* Quick page navigation */}
            {pagesWithMatches.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                        {tTools('pagesWithMatches') || 'Pages with matches:'}
                    </span>
                    {pagesWithMatches.map(page => (
                        <button
                            key={page}
                            onClick={() => {
                                onPageChange(page);
                                onSelectPageFilter(page);
                            }}
                            className={`px-2 py-1 text-xs rounded ${previewPage === page
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}

            {/* Preview Legend */}
            <div className="mb-3 flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-red-500/30 border-2 border-red-500 rounded"></span>
                    <span className="text-gray-600 dark:text-gray-400">{tTools('selectedMatch') || 'Selected'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-yellow-500/30 border-2 border-yellow-500 rounded"></span>
                    <span className="text-gray-600 dark:text-gray-400">{tTools('unselectedMatch') || 'Not selected'}</span>
                </div>
            </div>

            <div className="border rounded-lg overflow-auto bg-gray-100 dark:bg-gray-900" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
                <canvas ref={canvasRef} className="mx-auto" />
            </div>
        </Card>
    );
}
