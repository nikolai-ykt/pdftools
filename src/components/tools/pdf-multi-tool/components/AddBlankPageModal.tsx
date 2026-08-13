import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export interface AddBlankPageModalProps {
  open: boolean;
  totalPages: number;
  onClose: () => void;
  onAdd: (position: number, count: number) => void;
}

export function AddBlankPageModal({
  open,
  totalPages,
  onClose,
  onAdd,
}: AddBlankPageModalProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools');

  const [position, setPosition] = useState(1);
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (open) {
      setPosition(totalPages + 1);
      setCount(1);
    }
  }, [open, totalPages]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(position, count);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card variant="outlined" size="lg" className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        <form onSubmit={handleSubmit}>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {tTools('pdfMultiTool.addBlankPageTitle') || 'Add Blank Page'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tTools('pdfMultiTool.positionLabel') || 'Insert Position (1 to '}
                {totalPages + 1}):
              </label>
              <input
                type="number"
                min={1}
                max={totalPages + 1}
                value={position}
                onChange={(e) => setPosition(Math.max(1, Math.min(totalPages + 1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tTools('pdfMultiTool.numberOfPagesLabel') || 'Number of Blank Pages:'}
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">
              {t('buttons.cancel') || 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" className="flex-1">
              {t('buttons.add') || 'Add'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default React.memo(AddBlankPageModal);
