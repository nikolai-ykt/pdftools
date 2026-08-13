import React, { useState, useCallback } from 'react';
import type { PdfPage, PdfSource } from '../types';
import { PDFPageCard } from './PDFPageCard';

export interface PDFPageGridProps {
  pages: PdfPage[];
  sources: PdfSource[];
  selectedIds: Set<string>;
  thumbnails: Map<string, string>;
  onSelect: (id: string, multiSelect?: boolean) => void;
  onRotate: (id: string, degrees: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export function PDFPageGrid({
  pages,
  sources,
  selectedIds,
  thumbnails,
  onSelect,
  onRotate,
  onDuplicate,
  onDelete,
  onMove,
}: PDFPageGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onMove(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, onMove]);

  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[650px] overflow-y-auto">
      {pages.map((page, index) => (
        <PDFPageCard
          key={page.id}
          page={page}
          index={index}
          sources={sources}
          thumbnail={thumbnails.get(page.id)}
          isSelected={selectedIds.has(page.id)}
          isDragging={draggedIndex === index}
          isDragOver={dragOverIndex === index}
          onSelect={onSelect}
          onRotate={onRotate}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}

export default React.memo(PDFPageGrid);
