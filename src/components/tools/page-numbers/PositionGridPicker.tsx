'use client';

import React from 'react';
import type { Position } from './types';

interface PositionGridPickerProps {
  value: Position;
  onChange: (value: Position) => void;
  disabled?: boolean;
}

const POSITION_OPTIONS: { value: Position; label: string; icon: string }[] = [
  { value: 'top-left', label: 'Top Left', icon: '↖' },
  { value: 'top-center', label: 'Top Center', icon: '↑' },
  { value: 'top-right', label: 'Top Right', icon: '↗' },
  { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
  { value: 'bottom-center', label: 'Bottom Center', icon: '↓' },
  { value: 'bottom-right', label: 'Bottom Right', icon: '↘' },
];

export const PositionGridPicker: React.FC<PositionGridPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-3 gap-1.5 mb-4">
      {POSITION_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`
              p-2 rounded-md border transition-all text-center
              ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-200'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span className="text-base">{opt.icon}</span>
            <span className="block text-xs">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
