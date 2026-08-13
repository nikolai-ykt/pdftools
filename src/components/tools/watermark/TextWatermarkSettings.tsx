import React from 'react';
import { useTranslations } from 'next-intl';
import type { WatermarkSettings } from './types';

interface TextWatermarkSettingsProps {
  settings: WatermarkSettings;
  onChange: <K extends keyof WatermarkSettings>(key: K, value: WatermarkSettings[K]) => void;
  disabled?: boolean;
}

export function TextWatermarkSettings({ settings, onChange, disabled }: TextWatermarkSettingsProps) {
  const tTools = useTranslations('tools.watermark');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          {tTools('watermarkText')}
        </label>
        <input
          type="text"
          value={settings.text}
          onChange={(e) => onChange('text', e.target.value)}
          placeholder="CONFIDENTIAL"
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {tTools('fontSize')}
          </label>
          <input
            type="number"
            value={settings.fontSize}
            onChange={(e) => onChange('fontSize', parseInt(e.target.value) || 72)}
            min={10}
            max={200}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {tTools('color')}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.textColor}
              onChange={(e) => onChange('textColor', e.target.value)}
              className="w-10 h-10 p-1 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
              disabled={disabled}
            />
            <input
              type="text"
              value={settings.textColor}
              onChange={(e) => onChange('textColor', e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {tTools('opacity')}: {Math.round(settings.textOpacity * 100)}%
          </label>
          <input
            type="range"
            value={settings.textOpacity}
            onChange={(e) => onChange('textOpacity', parseFloat(e.target.value))}
            min={0.1}
            max={1}
            step={0.1}
            className="w-full"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {tTools('angle')}: {settings.textAngle}°
          </label>
          <input
            type="range"
            value={settings.textAngle}
            onChange={(e) => onChange('textAngle', parseInt(e.target.value))}
            min={-90}
            max={90}
            step={5}
            className="w-full"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
