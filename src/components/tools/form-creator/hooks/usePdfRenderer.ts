import { useState, useRef, useCallback, useEffect } from 'react';

export function usePdfRenderer(pdfDocRef: React.MutableRefObject<any>, currentPage: number) {
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderPage = useCallback(async (pdf: any, pageNum: number) => {
    if (!canvasRef.current || !pdf) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });

      const containerWidth = containerRef.current?.clientWidth || 600;
      const displayScale = Math.min(containerWidth / viewport.width, 1);
      setScale(displayScale);

      const renderScale = displayScale * 2;
      const renderViewport = page.getViewport({ scale: renderScale });
      const displayViewport = page.getViewport({ scale: displayScale });

      setPageSize({ width: displayViewport.width, height: displayViewport.height });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      canvas.style.width = `${displayViewport.width}px`;
      canvas.style.height = `${displayViewport.height}px`;

      await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
    } catch (err) {
      console.error('Failed to render page:', err);
    }
  }, []);

  useEffect(() => {
    if (pdfDocRef.current && currentPage > 0) {
      renderPage(pdfDocRef.current, currentPage);
    }
  }, [currentPage, pdfDocRef, renderPage]);

  return {
    canvasRef,
    containerRef,
    pageSize,
    scale,
    renderPage,
  };
}
