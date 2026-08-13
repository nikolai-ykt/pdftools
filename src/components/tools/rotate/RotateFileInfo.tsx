'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export interface RotateFileInfoProps {
  file: File;
  totalPages: number;
  isProcessing: boolean;
  onClearFile: () => void;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function RotateFileInfo({
  file,
  totalPages,
  isProcessing,
  onClearFile,
}: RotateFileInfoProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            <path d="M14 2v6h6" fill="white" />
            <text x="7" y="17" fontSize="6" fill="white" fontWeight="bold">PDF</text>
          </svg>
          <div>
            <p className="font-medium text-[hsl(var(--color-foreground))]">{file.name}</p>
            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
              {formatSize(file.size)} • {totalPages} {totalPages === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFile}
          disabled={isProcessing}
        >
          {t('buttons.remove') || 'Remove'}
        </Button>
      </div>
    </Card>
  );
}
