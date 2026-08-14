'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { drawPageNumberOverlay } from './usePageNumberOverlay';
import { formatPageNumber } from '@/lib/pdf/utils/formatters';
import type { PageNumbersConfig } from './types';

interface PageNumbersPreviewProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  renderPageToCanvas: (
    canvas: HTMLCanvasElement | null,
    pageNum: number,
    onAfterRender?: (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      scale: number
    ) => void
  ) => Promise<void>;
  config: PageNumbersConfig;
}

export const PageNumbersPreview: React.FC<PageNumbersPreviewProps> = ({
  totalPages,
  currentPage,
  onPageChange,
  renderPageToCanvas,
  config,
}) => {
  const tTools = useTranslations('tools');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomScale, setZoomScale] = useState<number>(0.5);

  // Trigger canvas re-rendering whenever page or any config property changes
  useEffect(() => {
    if (totalPages > 0 && canvasRef.current) {
      renderPageToCanvas(canvasRef.current, currentPage, (ctx, width, height, scale) => {
        drawPageNumberOverlay(ctx, width, height, currentPage, totalPages, scale, config);
      });
    }
  }, [totalPages, currentPage, config, renderPageToCanvas]);

  return (
    <Card variant="outlined" size="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{tTools('pageNumbers.preview')}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            ←
          </Button>
          <span className="text-sm">
            {tTools('pageNumbers.pageOf', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            →
          </Button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.25))}
          disabled={zoomScale <= 0.5}
          title={tTools('pageNumbers.zoomOut')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </Button>
        <span className="text-sm min-w-[60px] text-center">{Math.round(zoomScale * 100)}%</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoomScale((s) => Math.min(2, s + 0.25))}
          disabled={zoomScale >= 2}
          title={tTools('pageNumbers.zoomIn')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoomScale(0.5)}
          disabled={zoomScale === 0.5}
          title={tTools('pageNumbers.zoomReset')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>
      </div>

      <div
        className="bg-gray-100 dark:bg-gray-800 rounded-[var(--radius-md)] p-4 overflow-auto"
        style={{ maxHeight: '600px', minHeight: '500px' }}
      >
        <div
          className="flex justify-center"
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top center',
            minHeight: zoomScale < 1 ? 'auto' : undefined,
          }}
        >
          <canvas ref={canvasRef} className="shadow-lg bg-white" />
        </div>
      </div>

      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
        {config.skipFirstPage && currentPage === 1
          ? tTools('pageNumbers.firstPageSkipped')
          : tTools('pageNumbers.previewText', {
              text: formatPageNumber(currentPage, totalPages, {
                format: config.format,
                customFormat: config.customFormat,
                startNumber: config.startNumber,
                prefix: config.prefix,
                suffix: config.suffix,
              }),
            })}
      </p>
    </Card>
  );
};
