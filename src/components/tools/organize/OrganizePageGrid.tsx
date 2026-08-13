import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrganizePageCard } from './OrganizePageCard';
import type { OrganizePageGridProps } from './types';

export const OrganizePageGrid = React.memo<OrganizePageGridProps>(function OrganizePageGrid({
  pagePreviews,
  pageOrder,
  isLoadingPreviews,
  isProcessing,
  draggedIndex,
  dragOverIndex,
  hasOrderChanged,
  tReorderTitle,
  tReverseOrder,
  tResetOrder,
  tReorderHint,
  tLoading,
  tOrderChanged,
  onReverseOrder,
  onResetOrder,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMovePage,
  onDuplicatePage,
  onDeletePage,
  getPreviewForPage,
}) {
  if (pagePreviews.length === 0) return null;

  return (
    <Card variant="outlined" size="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-[hsl(var(--color-foreground))]">
          {tReorderTitle}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReverseOrder}
            disabled={isProcessing}
          >
            {tReverseOrder}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetOrder}
            disabled={isProcessing || !hasOrderChanged}
          >
            {tResetOrder}
          </Button>
        </div>
      </div>

      <p className="text-sm text-[hsl(var(--color-muted-foreground))] mb-4">
        {tReorderHint}
      </p>

      {isLoadingPreviews ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
              {tLoading}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto p-1">
          {pageOrder.map((pageNum, index) => {
            const preview = getPreviewForPage(pageNum);
            return (
              <OrganizePageCard
                key={`${pageNum}-${index}`}
                pageNum={pageNum}
                index={index}
                totalCount={pageOrder.length}
                preview={preview}
                isProcessing={isProcessing}
                draggedIndex={draggedIndex}
                dragOverIndex={dragOverIndex}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onMovePage={onMovePage}
                onDuplicatePage={onDuplicatePage}
                onDeletePage={onDeletePage}
              />
            );
          })}
        </div>
      )}

      {hasOrderChanged && (
        <div className="mt-4 p-3 rounded-[var(--radius-md)] bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-700">
            {tOrderChanged}
          </p>
        </div>
      )}
    </Card>
  );
});

OrganizePageGrid.displayName = 'OrganizePageGrid';
