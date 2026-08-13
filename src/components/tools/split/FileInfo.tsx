import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatFileSize } from '@/lib/pdf';
import { PdfIcon } from './icons/SplitIcons';

export interface FileInfoProps {
  file: File;
  totalPages: number;
  onRemove: () => void;
  disabled?: boolean;
}

export function FileInfo({ file, totalPages, onRemove, disabled = false }: FileInfoProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PdfIcon />
          <div>
            <p className="font-medium text-[hsl(var(--color-foreground))]">{file.name}</p>
            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
              {formatFileSize(file.size)} • {totalPages} {totalPages === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
        >
          {t('buttons.remove') || 'Remove'}
        </Button>
      </div>
    </Card>
  );
}
