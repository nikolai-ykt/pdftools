import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import type { WatermarkSettings } from './types';

interface RepeatWatermarkSettingsProps {
  settings: WatermarkSettings;
  onChange: <K extends keyof WatermarkSettings>(key: K, value: WatermarkSettings[K]) => void;
  disabled?: boolean;
}

export function RepeatWatermarkSettings({ settings, onChange, disabled }: RepeatWatermarkSettingsProps) {
  const tTools = useTranslations('tools.watermark');

  return (
    <Card variant="outlined" size="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {tTools('repeatTitle')}
        </h3>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative inline-flex">
            <input
              type="checkbox"
              className="sr-only"
              checked={settings.repeat}
              onChange={(e) => onChange('repeat', e.target.checked)}
              disabled={disabled}
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                settings.repeat ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.repeat ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {tTools('repeatEnable')}
          </span>
        </label>
      </div>

      {settings.repeat && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {tTools('repeatSpacingX')}: {settings.spacingX}pt
              </label>
              <input
                type="range"
                value={settings.spacingX}
                onChange={(e) => onChange('spacingX', parseInt(e.target.value))}
                min={20}
                max={600}
                step={10}
                className="w-full"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>20pt</span>
                <span>600pt</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {tTools('repeatSpacingY')}: {settings.spacingY}pt
              </label>
              <input
                type="range"
                value={settings.spacingY}
                onChange={(e) => onChange('spacingY', parseInt(e.target.value))}
                min={20}
                max={600}
                step={10}
                className="w-full"
                disabled={disabled}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>20pt</span>
                <span>600pt</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {tTools('staggerTitle')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tTools('staggerDescription')}
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative inline-flex">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings.stagger}
                  onChange={(e) => onChange('stagger', e.target.checked)}
                  disabled={disabled}
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    settings.stagger ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.stagger ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>
          </div>
        </div>
      )}
    </Card>
  );
}
