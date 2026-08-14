import { formatPageNumber } from '@/lib/pdf/utils/formatters';
import type { PageNumbersConfig, Position } from './types';

/**
 * Draws the page number text and highlight background onto a canvas context.
 */
export function drawPageNumberOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pageNum: number,
  totalPages: number,
  renderScale: number = 1,
  config: PageNumbersConfig
): void {
  const isOddPage = pageNum % 2 === 1;

  // Check if page number should be drawn based on pageMode & skipFirstPage
  if (config.skipFirstPage && pageNum === 1) return;
  if (config.pageMode === 'odd-only' && !isOddPage) return;
  if (config.pageMode === 'even-only' && isOddPage) return;

  const text = formatPageNumber(pageNum, totalPages, {
    format: config.format,
    customFormat: config.customFormat,
    startNumber: config.startNumber,
    prefix: config.prefix,
    suffix: config.suffix,
  });

  const scaledFontSize = config.fontSize * renderScale;
  const scaledMargin = config.margin * renderScale;

  ctx.font = `${scaledFontSize}px Arial`;
  ctx.fillStyle = config.fontColor;

  // Determine effective position
  let effectivePosition: Position = config.position;
  if (config.pageMode === 'odd-even-different') {
    effectivePosition = isOddPage ? config.oddPosition : config.evenPosition;
  }

  let x = 0;
  let y = 0;

  switch (effectivePosition) {
    case 'bottom-center':
      ctx.textAlign = 'center';
      x = width / 2;
      y = height - scaledMargin;
      break;
    case 'bottom-left':
      ctx.textAlign = 'left';
      x = scaledMargin;
      y = height - scaledMargin;
      break;
    case 'bottom-right':
      ctx.textAlign = 'right';
      x = width - scaledMargin;
      y = height - scaledMargin;
      break;
    case 'top-center':
      ctx.textAlign = 'center';
      x = width / 2;
      y = scaledMargin + scaledFontSize;
      break;
    case 'top-left':
      ctx.textAlign = 'left';
      x = scaledMargin;
      y = scaledMargin + scaledFontSize;
      break;
    case 'top-right':
      ctx.textAlign = 'right';
      x = width - scaledMargin;
      y = scaledMargin + scaledFontSize;
      break;
  }

  // Draw background highlight for contrast/visibility
  const metrics = ctx.measureText(text);
  const padding = 4 * renderScale;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(
    x - (ctx.textAlign === 'center' ? metrics.width / 2 : ctx.textAlign === 'right' ? metrics.width : 0) - padding,
    y - scaledFontSize,
    metrics.width + padding * 2,
    scaledFontSize + padding
  );

  // Draw text
  ctx.fillStyle = config.fontColor;
  ctx.fillText(text, x, y);
}
