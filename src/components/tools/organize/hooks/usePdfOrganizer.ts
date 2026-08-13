import { useState, useCallback } from 'react';

export function usePdfOrganizer() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const selectFile = useCallback((newFile: File, count: number) => {
    setFile(newFile);
    setTotalPages(count);
    setPageOrder(Array.from({ length: count }, (_, i) => i + 1));
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setTotalPages(0);
    setPageOrder([]);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const movePage = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0) return;
    setPageOrder((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [movedPage] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedPage);
      return next;
    });
  }, []);

  const duplicatePage = useCallback((index: number) => {
    setPageOrder((prev) => {
      if (index < 0 || index >= prev.length) {
        return prev;
      }
      const next = [...prev];
      next.splice(index + 1, 0, prev[index]);
      return next;
    });
  }, []);

  const deletePage = useCallback((index: number) => {
    setPageOrder((prev) => {
      if (prev.length <= 1 || index < 0 || index >= prev.length) {
        return prev;
      }
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  const reverseOrder = useCallback(() => {
    setPageOrder((prev) => [...prev].reverse());
  }, []);

  const resetOrder = useCallback(() => {
    setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1));
  }, [totalPages]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedIndex((dragged) => {
      if (dragged !== null && dragged !== index) {
        setDragOverIndex(index);
      }
      return dragged;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex((dragged) => {
      setDragOverIndex((over) => {
        if (dragged !== null && over !== null && dragged !== over) {
          setPageOrder((prev) => {
            if (
              dragged < 0 ||
              dragged >= prev.length ||
              over < 0 ||
              over >= prev.length
            ) {
              return prev;
            }
            const next = [...prev];
            const [draggedPage] = next.splice(dragged, 1);
            next.splice(over, 0, draggedPage);
            return next;
          });
        }
        return null;
      });
      return null;
    });
  }, []);

  const hasOrderChanged =
    pageOrder.length !== totalPages ||
    pageOrder.some((num, idx) => num !== idx + 1);

  return {
    file,
    totalPages,
    pageOrder,
    draggedIndex,
    dragOverIndex,
    hasOrderChanged,
    selectFile,
    clearFile,
    movePage,
    duplicatePage,
    deletePage,
    reverseOrder,
    resetOrder,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
