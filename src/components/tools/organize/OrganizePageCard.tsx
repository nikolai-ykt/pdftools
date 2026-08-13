import React from 'react';
import type { OrganizePageCardProps } from './types';

export const OrganizePageCard = React.memo<OrganizePageCardProps>(function OrganizePageCard({
  pageNum,
  index,
  totalCount,
  preview,
  isProcessing,
  draggedIndex,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMovePage,
  onDuplicatePage,
  onDeletePage,
}) {
  const isDragged = draggedIndex === index;
  const isDragOver = dragOverIndex === index;

  return (
    <div
      draggable={!isProcessing}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`
        relative aspect-[3/4] rounded-[var(--radius-md)] border-2 overflow-hidden transition-all
        ${isDragged ? 'opacity-50 border-dashed scale-95' : ''}
        ${isDragOver ? 'border-[hsl(var(--color-primary))] ring-2 ring-[hsl(var(--color-primary)/0.3)]' : 'border-[hsl(var(--color-border))]'}
        ${!isProcessing ? 'cursor-grab hover:border-[hsl(var(--color-primary)/0.5)]' : ''}
      `}
    >
      {preview?.thumbnail ? (
        <img
          src={preview.thumbnail}
          alt={`Page ${pageNum}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-[hsl(var(--color-muted))] flex items-center justify-center">
          <span className="text-lg font-medium text-[hsl(var(--color-muted-foreground))]">
            {pageNum}
          </span>
        </div>
      )}

      {/* Page number badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center font-medium">
        {pageNum}
      </div>

      {/* Position indicator */}
      <div className="absolute top-1 left-1 w-5 h-5 bg-[hsl(var(--color-primary))] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
        {index + 1}
      </div>

      {/* Move buttons */}
      <div className="absolute top-1 right-1 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMovePage(index, index - 1); }}
          disabled={index === 0 || isProcessing}
          className="w-5 h-5 bg-white/90 rounded flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Move up"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMovePage(index, index + 1); }}
          disabled={index === totalCount - 1 || isProcessing}
          className="w-5 h-5 bg-white/90 rounded flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Move down"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Duplicate and Delete buttons */}
      <div className="absolute bottom-6 right-1 flex gap-0.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicatePage(index); }}
          disabled={isProcessing}
          className="w-5 h-5 bg-blue-500/90 rounded flex items-center justify-center hover:bg-blue-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Duplicate page"
          title="Duplicate"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDeletePage(index); }}
          disabled={totalCount <= 1 || isProcessing}
          className="w-5 h-5 bg-red-500/90 rounded flex items-center justify-center hover:bg-red-600 text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Delete page"
          title="Delete"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  );
});

OrganizePageCard.displayName = 'OrganizePageCard';
