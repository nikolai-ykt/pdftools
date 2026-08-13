import React from 'react';
import { useTranslations } from 'next-intl';
import { formatFileSize } from '@/lib/utils/formatFileSize';
import type { WatermarkSettings } from './types';

interface ImageWatermarkSettingsProps {
  settings: WatermarkSettings;
  onChange: <K extends keyof WatermarkSettings>(key: K, value: WatermarkSettings[K]) => void;
  onError: (error: string | null) => void;
  disabled?: boolean;
}

export function ImageWatermarkSettings({ settings, onChange, onError, disabled }: ImageWatermarkSettingsProps) {
  const tTools = useTranslations('tools.watermark');

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'image/png' || selectedFile.type === 'image/jpeg') {
        onChange('imageFile', selectedFile);
        onError(null);
      } else {
        onError(tTools('unsupportedImage'));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          {tTools('watermarkImage')}
        </label>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleImageSelected}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          disabled={disabled}
        />
        {settings.imageFile && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {settings.imageFile.name} ({formatFileSize(settings.imageFile.size)})
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {tTools('opacity')}: {Math.round(settings.imageOpacity * 100)}%
          </label>
          <input
            type="range"
            value={settings.imageOpacity}
            onChange={(e) => onChange('imageOpacity', parseFloat(e.target.value))}
            min={0.1}
            max={1}
            step={0.1}
            className="w-full"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {tTools('angle')}: {settings.imageAngle}°
          </label>
          <input
            type="range"
            value={settings.imageAngle}
            onChange={(e) => onChange('imageAngle', parseInt(e.target.value))}
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
