import { useCallback, useRef } from 'react';
import { configurePdfjsWorker } from '@/lib/pdf/loader';
import type { PDFFile, PageTextContent, TextWordInfo } from '../types';

export function usePdfLoader() {
  const cancelledRef = useRef(false);

  const cancelLoading = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const resetCancelled = useCallback(() => {
    cancelledRef.current = false;
  }, []);

  const loadPDF = useCallback(
    async (
      file: File,
      slotNum: 1 | 2,
      onProgress?: (percent: number) => void
    ): Promise<PDFFile | null> => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        configurePdfjsWorker(pdfjsLib);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;

        const pageTextContents: PageTextContent[] = [];
        const pagesImages: string[] = [];
        const pageDimensions: Array<{ width: number; height: number; scale: number }> = [];

        const renderScale = 1.5;

        for (let i = 1; i <= pageCount; i++) {
          if (cancelledRef.current) return null;

          const baseProg = slotNum === 1 ? 0 : 50;
          if (onProgress) {
            onProgress(baseProg + Math.round((i / pageCount) * 45));
          }

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: renderScale });
          pageDimensions.push({ width: viewport.width, height: viewport.height, scale: renderScale });

          // Render page to DataURL
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport }).promise;
          pagesImages.push(canvas.toDataURL('image/jpeg', 0.85));

          // Extract Bounding Box coordinates for text items
          const textContent = await page.getTextContent();
          const words: TextWordInfo[] = [];
          let rawText = '';

          textContent.items.forEach((item: any, itemIdx: number) => {
            if (!item.str || item.str.trim() === '') return;

            const strVal = item.str;
            const tx = item.transform[4];
            const ty = item.transform[5];
            const itemWidth = item.width || 0;
            const itemHeight = item.height || parseInt(item.transform[3], 10) || 12;
            const fontName = item.fontName || '';

            const ptTopLeft = viewport.convertToViewportPoint(tx, ty + itemHeight);
            const ptBottomRight = viewport.convertToViewportPoint(tx + itemWidth, ty);

            const canvasX = ptTopLeft[0];
            const canvasY = ptTopLeft[1];
            const canvasW = Math.max(2, ptBottomRight[0] - ptTopLeft[0]);
            const canvasH = Math.max(2, ptBottomRight[1] - ptTopLeft[1]);

            const isChinese = /[\u4e00-\u9fa5]/.test(strVal);

            if (isChinese) {
              const chars = strVal.split('');
              const charW = canvasW / chars.length;
              chars.forEach((char: string, charIdx: number) => {
                words.push({
                  text: char,
                  x: canvasX + charIdx * charW,
                  y: canvasY,
                  w: charW,
                  h: canvasH,
                  fontName,
                  itemIdx
                });
              });
              rawText += strVal;
            } else {
              const tokens = strVal.split(/(\s+)/);
              let currentTokenX = canvasX;
              const totalChars = strVal.length || 1;
              const pxPerChar = canvasW / totalChars;

              tokens.forEach((token: string) => {
                const tokenW = token.length * pxPerChar;
                if (token.trim() !== '') {
                  words.push({
                    text: token,
                    x: currentTokenX,
                    y: canvasY,
                    w: tokenW,
                    h: canvasH,
                    fontName,
                    itemIdx
                  });
                }
                currentTokenX += tokenW;
              });
              rawText += strVal + ' ';
            }
          });

          pageTextContents.push({
            rawText,
            words,
            originalItems: textContent.items
          });
        }

        return {
          file,
          pageCount,
          pageTextContents,
          pagesImages,
          pageDimensions
        };
      } catch (err) {
        console.error('PDF parsing error:', err);
        throw err;
      }
    },
    []
  );

  return {
    loadPDF,
    cancelLoading,
    resetCancelled,
    cancelledRef
  };
}
