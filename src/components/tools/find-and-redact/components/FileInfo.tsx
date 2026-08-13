import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatFileSize } from '../utils/formatFileSize';

interface FileInfoProps {
    file: File;
    onClear: () => void;
    disabled: boolean;
}

export function FileInfo({ file, onClear, disabled }: FileInfoProps) {
    const t = useTranslations('common');

    return (
        <Card variant="outlined">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                    </svg>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
                    {t('buttons.remove')}
                </Button>
            </div>
        </Card>
    );
}
