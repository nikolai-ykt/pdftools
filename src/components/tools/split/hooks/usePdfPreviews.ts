import { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface PagePreview {
  pageNumber: number;
  thumbnail?: string;
}

export interface UsePdfPreviewsReturn {
  pagePreviews: PagePreview[];
  selectedPages: Set<number>;
  isLoadingPreviews: boolean;
  handleTogglePage: (pageNumber: number) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  setSelectedPages: React.Dispatch<React.SetStateAction<Set<number>>>;
}

export function usePdfPreviews(
  pdfDoc: PDFDocumentProxy | null,
  totalPages: number
): UsePdfPreviewsReturn {
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isLoadingPreviews, setIsLoadingPreviews] = useState<boolean>(false);

  const loadIdRef = useRef<number>(0);

  const handleTogglePage = useCallback((pageNumber: number) => {
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
  }, [totalPages]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  useEffect(() => {
    if (!pdfDoc || totalPages <= 0) {
      setPagePreviews([]);
      setSelectedPages(new Set());
      setIsLoadingPreviews(false);
      return;
    }

    const currentLoadId = ++loadIdRef.current;
    setIsLoadingPreviews(true);

    // Initialize skeleton previews array immediately
    const initialPreviews: PagePreview[] = Array.from({ length: totalPages }, (_, i) => ({
      pageNumber: i + 1,
    }));
    setPagePreviews(initialPreviews);

    const generateThumbnails = async () => {
      const maxPreviewPages = Math.min(totalPages, 50);
      const batchSize = 4; // Process in small concurrent batches

      for (let i = 1; i <= maxPreviewPages; i += batchSize) {
        if (loadIdRef.current !== currentLoadId) return;

        const batchEnd = Math.min(i + batchSize - 1, maxPreviewPages);
        const batchPromises: Promise<PagePreview>[] = [];

        for (let pageNum = i; pageNum <= batchEnd; pageNum++) {
          batchPromises.push(
            (async () => {
              try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 0.2 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                if (context) {
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;

                  await page.render({
                    canvasContext: context,
                    viewport,
                  }).promise;

                  return {
                    pageNumber: pageNum,
                    thumbnail: canvas.toDataURL('image/jpeg', 0.7),
                  };
                }
              } catch (err) {
                console.warn(`Failed to render thumbnail for page ${pageNum}:`, err);
              }
              return { pageNumber: pageNum };
            })()
          );
        }

        const renderedBatch = await Promise.all(batchPromises);

        if (loadIdRef.current !== currentLoadId) return;

        setPagePreviews((prev) => {
          const updated = [...prev];
          for (const item of renderedBatch) {
            updated[item.pageNumber - 1] = item;
          }
          return updated;
        });
      }

      if (loadIdRef.current === currentLoadId) {
        setIsLoadingPreviews(false);
      }
    };

    generateThumbnails();

    return () => {
      loadIdRef.current++;
    };
  }, [pdfDoc, totalPages]);

  return {
    pagePreviews,
    selectedPages,
    isLoadingPreviews,
    handleTogglePage,
    handleSelectAll,
    handleDeselectAll,
    setSelectedPages,
  };
}
