import React from 'react';
import type { PdfPage, PdfSource } from '../types';

export interface PDFPageCardProps {
  page: PdfPage;
  index: number;
  sources: PdfSource[];
  thumbnail?: string;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onSelect: (id: string, multiSelect?: boolean) => void;
  onRotate: (id: string, degrees: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export const PDFPageCard = React.memo(function PDFPageCard({
  page,
  index,
  sources,
  thumbnail,
  isSelected,
  isDragging,
  isDragOver,
  onSelect,
  onRotate,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}: PDFPageCardProps) {
  const sourceFile = page.sourceFileId ? sources.find(s => s.id === page.sourceFileId) : null;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onClick={(e) => onSelect(page.id, e.shiftKey || e.ctrlKey || e.metaKey)}
      className={`
        relative group rounded-lg border-2 p-2 cursor-pointer transition-all duration-150 flex flex-col items-center select-none bg-white dark:bg-gray-800
        ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'}
        ${isDragging ? 'opacity-40 border-dashed' : ''}
        ${isDragOver ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : ''}
      `}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(page.id, true);
          }}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      {/* Action Overlay */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 dark:bg-gray-800/90 rounded p-1 shadow">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRotate(page.id, -90);
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
          title="Rotate left"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRotate(page.id, 90);
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
          title="Rotate right"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(page.id);
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
          title="Duplicate"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(page.id);
          }}
          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Page Preview Thumbnail Container */}
      <div className="w-full aspect-[1/1.4] bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center overflow-hidden mb-2 relative">
        {page.isBlank ? (
          <div className="text-center p-2">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs text-gray-400 font-medium">Blank</span>
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={`Page ${index + 1}`}
            className="max-h-full max-w-full object-contain transition-transform duration-200"
            style={{ transform: `rotate(${page.rotation}deg)` }}
          />
        ) : (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mb-1" />
            <span className="text-[10px] text-gray-400">Loading...</span>
          </div>
        )}

        {/* Rotation Badge if rotated */}
        {page.rotation !== 0 && (
          <span className="absolute bottom-1 right-1 z-10 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
            {page.rotation}°
          </span>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <span className="font-semibold text-gray-700 dark:text-gray-300">#{index + 1}</span>
        {sourceFile && (
          <span className="truncate max-w-[90px] text-[10px]" title={sourceFile.name}>
            {sourceFile.name} (p.{page.originalPageNumber})
          </span>
        )}
      </div>
    </div>
  );
});

export default PDFPageCard;
