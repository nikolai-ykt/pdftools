import { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { configurePdfjsWorker } from '@/lib/pdf/loader';
import type { BookmarkInfo } from '@/lib/pdf';

interface OutlineItem {
  title: string;
  dest?: string | unknown[] | null;
  items?: OutlineItem[];
}

export interface UsePdfDocumentReturn {
  pdfDoc: PDFDocumentProxy | null;
  totalPages: number;
  bookmarks: BookmarkInfo[];
  isLoading: boolean;
  error: string | null;
  clearDocument: () => Promise<void>;
}

export function usePdfDocument(file: File | null): UsePdfDocumentReturn {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [bookmarks, setBookmarks] = useState<BookmarkInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const loadIdRef = useRef<number>(0);

  const destroyCurrentDoc = useCallback(async () => {
    if (pdfDocRef.current) {
      try {
        await pdfDocRef.current.destroy();
      } catch (err) {
        console.warn('Error destroying PDF document instance:', err);
      } finally {
        pdfDocRef.current = null;
      }
    }
    setPdfDoc(null);
    setTotalPages(0);
    setBookmarks([]);
  }, []);

  const parseOutlineToBookmarks = async (
    outline: OutlineItem[],
    pdf: PDFDocumentProxy
  ): Promise<BookmarkInfo[]> => {
    const result: BookmarkInfo[] = [];

    for (const item of outline) {
      let pageNumber = 1;

      if (item.dest) {
        try {
          const dest = typeof item.dest === 'string'
            ? await pdf.getDestination(item.dest)
            : item.dest;

          if (Array.isArray(dest) && dest[0]) {
            const pageRef = dest[0];
            const pageIndex = await pdf.getPageIndex(pageRef);
            pageNumber = pageIndex + 1;
          }
        } catch (e) {
          console.warn('Failed to get destination for bookmark:', item.title);
        }
      }

      const bookmark: BookmarkInfo = {
        title: item.title || 'Untitled',
        pageNumber,
        children: item.items && item.items.length > 0
          ? await parseOutlineToBookmarks(item.items, pdf)
          : undefined,
      };

      result.push(bookmark);
    }

    return result;
  };

  useEffect(() => {
    if (!file) {
      destroyCurrentDoc();
      setError(null);
      setIsLoading(false);
      return;
    }

    const currentLoadId = ++loadIdRef.current;
    setIsLoading(true);
    setError(null);

    const loadDocument = async () => {
      // Destroy previous doc if existing
      await destroyCurrentDoc();

      try {
        const pdfjsLib = await import('pdfjs-dist');
        configurePdfjsWorker(pdfjsLib);

        const arrayBuffer = await file.arrayBuffer();

        if (loadIdRef.current !== currentLoadId) return;

        const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (loadIdRef.current !== currentLoadId) {
          await loadedPdf.destroy();
          return;
        }

        pdfDocRef.current = loadedPdf;
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);

        // Extract bookmarks / outline
        try {
          const outline = await loadedPdf.getOutline();
          if (outline && outline.length > 0 && loadIdRef.current === currentLoadId) {
            const extractedBookmarks = await parseOutlineToBookmarks(outline as OutlineItem[], loadedPdf);
            if (loadIdRef.current === currentLoadId) {
              setBookmarks(extractedBookmarks);
            }
          }
        } catch (bookmarkErr) {
          console.warn('Failed to extract bookmarks:', bookmarkErr);
        }
      } catch (err) {
        if (loadIdRef.current === currentLoadId) {
          console.error('Failed to load PDF document:', err);
          setError('Failed to load PDF preview. The file may be corrupted or encrypted.');
          setPdfDoc(null);
          setTotalPages(0);
          setBookmarks([]);
        }
      } finally {
        if (loadIdRef.current === currentLoadId) {
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      // Teardown when component unmounts
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
    };
  }, [file, destroyCurrentDoc]);

  return {
    pdfDoc,
    totalPages,
    bookmarks,
    isLoading,
    error,
    clearDocument: destroyCurrentDoc,
  };
}
