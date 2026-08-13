import React from 'react';
import { useTranslations } from 'next-intl';
import type { WatermarkType } from './types';

interface WatermarkTypeSelectorProps {
  value: WatermarkType;
  onChange: (type: WatermarkType) => void;
  disabled?: boolean;
}

export function WatermarkTypeSelector({ value, onChange, disabled }: WatermarkTypeSelectorProps) {
  const tTools = useTranslations('tools.watermark');

  return (
    <div className="flex gap-6 mb-6">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="watermark-type"
          value="text"
          checked={value === 'text'}
          onChange={() => onChange('text')}
          className="w-4 h-4 text-blue-600"
          disabled={disabled}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {tTools('textWatermark')}
        </span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="watermark-type"
          value="image"
          checked={value === 'image'}
          onChange={() => onChange('image')}
          className="w-4 h-4 text-blue-600"
          disabled={disabled}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {tTools('imageWatermark')}
        </span>
      </label>
    </div>
  );
}
