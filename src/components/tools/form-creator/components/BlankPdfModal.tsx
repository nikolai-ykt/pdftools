import React from 'react';
import { FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export type PageSizeType = 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';

interface BlankPdfModalProps {
  isOpen: boolean;
  pageSize: PageSizeType;
  setPageSize: (size: PageSizeType) => void;
  pageCount: number;
  setPageCount: (count: number) => void;
  onClose: () => void;
  onCreate: () => void;
  tTools: (key: string) => string;
}

export function BlankPdfModal({
  isOpen,
  pageSize,
  setPageSize,
  pageCount,
  setPageCount,
  onClose,
  onCreate,
  tTools,
}: BlankPdfModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card variant="outlined" size="lg" className="w-full max-w-md mx-4 bg-white shadow-xl">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <FilePlus2 className="w-5 h-5 text-blue-500" />
          {tTools('formCreator.createBlankPdfTitle') || 'Create Blank PDF'}
        </h3>
        <div className="space-y-4">
          {/* Page Size */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {tTools('formCreator.pageSize') || 'Page Size'}
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as PageSizeType)}
              className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Legal">Legal (8.5 × 14 in)</option>
              <option value="A3">A3 (297 × 420 mm)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
            </select>
          </div>

          {/* Page Count */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {tTools('formCreator.pageCount') || 'Number of Pages'}
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={pageCount}
              onChange={(e) =>
                setPageCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))
              }
              className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"
            />
          </div>

          <div className="text-xs text-gray-500">
            <p>
              {tTools('formCreator.blankPdfNote') ||
                'A blank PDF will be created for you to add form fields.'}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {tTools('formCreator.cancelButton') || 'Cancel'}
            </Button>
            <Button variant="primary" size="sm" onClick={onCreate}>
              <FilePlus2 className="w-4 h-4 mr-2" />
              {tTools('formCreator.createButton') || 'Create'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
