import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export interface PDFToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  pageCount: number;
  selectedCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRotateSelected: (degrees: number) => void;
  onDuplicateSelected: () => void;
  onAddBlank: () => void;
  onDeleteSelected: () => void;
}

export function PDFToolbar({
  canUndo,
  canRedo,
  pageCount,
  selectedCount,
  onUndo,
  onRedo,
  onReset,
  onSelectAll,
  onDeselectAll,
  onRotateSelected,
  onDuplicateSelected,
  onAddBlank,
  onDeleteSelected,
}: PDFToolbarProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools');

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center justify-between">
      {/* Undo/Redo & Page counts */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title={tTools('pdfMultiTool.undo') || 'Undo'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title={tTools('pdfMultiTool.redo') || 'Redo'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </Button>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
          {pageCount} {pageCount === 1 ? t('page') || 'page' : t('pages') || 'pages'}
          {selectedCount > 0 && ` (${selectedCount} ${t('selected') || 'selected'})`}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        {selectedCount > 0 ? (
          <Button variant="outline" size="sm" onClick={onDeselectAll}>
            {tTools('pdfMultiTool.deselectAll') || 'Deselect all'}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            {tTools('pdfMultiTool.selectAll') || 'Select all'}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onRotateSelected(-90)}
          disabled={selectedCount === 0}
          title={tTools('pdfMultiTool.rotateLeft') || 'Rotate left'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          -90°
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onRotateSelected(90)}
          disabled={selectedCount === 0}
          title={tTools('pdfMultiTool.rotateRight') || 'Rotate right'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          +90°
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicateSelected}
          disabled={selectedCount === 0}
          title={tTools('pdfMultiTool.duplicate') || 'Duplicate'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onAddBlank}
          title={tTools('pdfMultiTool.addBlankPage') || 'Add blank page'}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {tTools('pdfMultiTool.blank') || 'Blank'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className="!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20"
          title={tTools('pdfMultiTool.delete') || 'Delete'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          {t('buttons.reset') || 'Clear All'}
        </Button>
      </div>
    </div>
  );
}

export default React.memo(PDFToolbar);
