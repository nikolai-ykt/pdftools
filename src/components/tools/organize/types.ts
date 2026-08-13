import React from 'react';

export interface PagePreview {
  pageNumber: number;
  thumbnail?: string;
}

export interface OrganizePDFToolProps {
  /** Custom class name */
  className?: string;
}

export interface OrganizeFileInfoProps {
  file: File;
  totalPages: number;
  isProcessing: boolean;
  onClear: () => void;
  formatSize: (bytes: number) => string;
  tRemove: string;
}

export interface OrganizePageCardProps {
  pageNum: number;
  index: number;
  totalCount: number;
  preview?: PagePreview;
  isProcessing: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
}

export interface OrganizePageGridProps {
  file: File;
  pagePreviews: PagePreview[];
  pageOrder: number[];
  isLoadingPreviews: boolean;
  isProcessing: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  hasOrderChanged: boolean;
  tReorderTitle: string;
  tReverseOrder: string;
  tResetOrder: string;
  tReorderHint: string;
  tLoading: string;
  tOrderChanged: string;
  onReverseOrder: () => void;
  onResetOrder: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  getPreviewForPage: (pageNum: number) => PagePreview | undefined;
}
