import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';

interface WatermarkPreviewProps {
  url: string | null;
  loading: boolean;
}

export function WatermarkPreview({ url, loading }: WatermarkPreviewProps) {
  const tTools = useTranslations('tools.watermark');

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">
            {tTools('previewTitle')}
          </h3>
          <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
            {tTools('previewNote')}
          </p>
        </div>
        {loading && (
          <span className="text-sm text-[hsl(var(--color-muted-foreground))] flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {tTools('previewGenerating')}
          </span>
        )}
      </div>

      <Card className="flex-1 min-h-[600px] overflow-hidden relative border-dashed border-2 flex items-center justify-center bg-[hsl(var(--color-muted)/0.3)]">
        {url ? (
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full absolute inset-0 border-0"
            title="Watermark Preview"
          />
        ) : (
          <div className="text-[hsl(var(--color-muted-foreground))] text-center p-8">
            <svg
              className="w-12 h-12 mx-auto mb-4 opacity-20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <p>{tTools('previewTitle')}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
