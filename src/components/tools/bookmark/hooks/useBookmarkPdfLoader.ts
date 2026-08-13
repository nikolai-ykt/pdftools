import { useState, useCallback, useRef, useEffect } from 'react';
import type { BookmarkNode } from '../types';

let pdfjsModule: typeof import('pdfjs-dist') | null = null;

const loadPdfjsLib = async () => {
  if (pdfjsModule) return pdfjsModule;

  const pdfjsLib = await import('pdfjs-dist');
  const { configurePdfjsWorker } = await import('@/lib/pdf/loader');

  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    configurePdfjsWorker(pdfjsLib);
  }

  pdfjsModule = pdfjsLib;
  return pdfjsLib;
};

export function useBookmarkPdfLoader(
  onBookmarksExtracted: (bookmarks: BookmarkNode[]) => void,
  onError: (err: string) => void
) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExtractingBookmarks, setIsExtractingBookmarks] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const parseOutline = async (outline: any[], doc: any): Promise<BookmarkNode[]> => {
    const result: BookmarkNode[] = [];

    for (const item of outline) {
      let pageNumber = 1;

      if (item.dest) {
        try {
          const dest = typeof item.dest === 'string'
            ? await doc.getDestination(item.dest)
            : item.dest;
          if (dest && dest[0]) {
            const pageRef = dest[0];
            const pageIndex = await doc.getPageIndex(pageRef);
            pageNumber = pageIndex + 1;
          }
        } catch (e) {
          console.warn('Failed to get destination for bookmark:', item.title);
        }
      }

      let style: 'bold' | 'italic' | 'bold-italic' | undefined = undefined;
      if (item.bold && item.italic) style = 'bold-italic';
      else if (item.bold) style = 'bold';
      else if (item.italic) style = 'italic';

      let color: string | undefined = undefined;
      if (item.color && item.color.length === 3) {
        const r = item.color[0].toString(16).padStart(2, '0');
        const g = item.color[1].toString(16).padStart(2, '0');
        const b = item.color[2].toString(16).padStart(2, '0');
        color = `#${r}${g}${b}`;
      }

      const node: BookmarkNode = {
        id: `bm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title || 'Untitled',
        pageNumber,
        children: [],
        color,
        style,
        isExpanded: true,
      };

      if (item.items && item.items.length > 0) {
        node.children = await parseOutline(item.items, doc);
      }

      result.push(node);
    }

    return result;
  };

  const loadPdf = useCallback(async (pdfFile: File) => {
    try {
      const pdfjsLib = await loadPdfjsLib();
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;

      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);

      setIsExtractingBookmarks(true);
      try {
        const outline = await doc.getOutline();
        if (outline && outline.length > 0) {
          const extracted = await parseOutline(outline, doc);
          onBookmarksExtracted(extracted);
        }
      } catch (err) {
        console.warn('Failed to extract bookmarks:', err);
      }
      setIsExtractingBookmarks(false);
    } catch (err) {
      onError('Failed to load PDF file.');
      console.error(err);
    }
  }, [onBookmarksExtracted, onError]);

  const handleExtractBookmarks = useCallback(async (
    hasExistingBookmarks: boolean,
    confirmMsg: string,
    noBookmarksMsg: string,
    failedExtractMsg: string
  ) => {
    if (!pdfDoc) return;

    if (hasExistingBookmarks) {
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    setIsExtractingBookmarks(true);
    try {
      const outline = await pdfDoc.getOutline();
      if (outline && outline.length > 0) {
        const extracted = await parseOutline(outline, pdfDoc);
        onBookmarksExtracted(extracted);
      } else {
        alert(noBookmarksMsg);
      }
    } catch (err) {
      console.warn('Failed to extract bookmarks:', err);
      alert(failedExtractMsg);
    }
    setIsExtractingBookmarks(false);
  }, [pdfDoc, onBookmarksExtracted]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const containerWidth = 600;
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(containerWidth / viewport.width, 1.5);
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: scaledViewport,
      }).promise;
    } catch (err) {
      console.error('Failed to render page:', err);
    }
  }, [pdfDoc]);

  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  const clearPdf = useCallback(() => {
    setPdfDoc(null);
    setTotalPages(0);
    setCurrentPage(1);
  }, []);

  return {
    pdfDoc,
    totalPages,
    currentPage,
    setCurrentPage,
    isExtractingBookmarks,
    canvasRef,
    loadPdf,
    clearPdf,
    handleExtractBookmarks,
  };
}
