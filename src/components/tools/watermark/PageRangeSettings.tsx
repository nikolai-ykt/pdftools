import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import type { PageSelectionSettings, PageSelectionMode } from './types';

interface PageRangeSettingsProps {
  settings: PageSelectionSettings;
  onChange: <K extends keyof PageSelectionSettings>(key: K, value: PageSelectionSettings[K]) => void;
  disabled?: boolean;
}

export function PageRangeSettings({ settings, onChange, disabled }: PageRangeSettingsProps) {
  const tTools = useTranslations('tools.watermark');

  return (
    <Card variant="outlined" size="lg">
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
        {tTools('rangeTitle')}
      </h3>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          {(['all', 'odd', 'even', 'custom'] as PageSelectionMode[]).map((mode) => (
            <label key={mode} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="page-mode"
                value={mode}
                checked={settings.mode === mode}
                onChange={() => onChange('mode', mode)}
                className="w-4 h-4 text-blue-600"
                disabled={disabled}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {tTools(mode === 'all' ? 'rangeAll' : mode === 'odd' ? 'rangeOdd' : mode === 'even' ? 'rangeEven' : 'rangeCustom')}
              </span>
            </label>
          ))}
        </div>

        {settings.mode === 'custom' && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="text"
              value={settings.customRange}
              onChange={(e) => onChange('customRange', e.target.value)}
              placeholder={tTools('rangePlaceholder')}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
