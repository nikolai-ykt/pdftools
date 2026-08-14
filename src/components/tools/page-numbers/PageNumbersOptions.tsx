'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { PositionGridPicker } from './PositionGridPicker';
import type { PageNumbersConfig, Format, Position, PageMode } from './types';

interface PageNumbersOptionsProps {
  config: PageNumbersConfig;
  onChange: (updater: Partial<PageNumbersConfig>) => void;
  disabled?: boolean;
}

export const PageNumbersOptions: React.FC<PageNumbersOptionsProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const tTools = useTranslations('tools');

  return (
    <Card variant="outlined" className="p-4">
      {/* Position Section */}
      <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
        {tTools('pageNumbers.positionTitle')}
      </h4>
      <PositionGridPicker
        value={config.position}
        onChange={(pos) => onChange({ position: pos })}
        disabled={disabled}
      />

      {/* Format Section */}
      <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
        {tTools('pageNumbers.formatTitle')}
      </h4>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.style')}</label>
          <select
            value={config.format}
            onChange={(e) => onChange({ format: e.target.value as Format })}
            className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
            disabled={disabled}
          >
            <option value="number">1, 2, 3...</option>
            <option value="roman">I, II, III...</option>
            <option value="page-of-total">Page 1 of N</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.startNumber')}</label>
          <input
            type="number"
            value={config.startNumber}
            onChange={(e) => onChange({ startNumber: parseInt(e.target.value, 10) || 1 })}
            min={1}
            className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
            disabled={disabled}
          />
        </div>
      </div>

      {config.format === 'custom' && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.customFormat')}</label>
          <input
            type="text"
            value={config.customFormat}
            onChange={(e) => onChange({ customFormat: e.target.value })}
            placeholder="Page {page} of {total}"
            className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
            disabled={disabled}
          />
          <p className="text-xs text-gray-500 mt-1">{tTools('pageNumbers.customFormatHint')}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.prefix')}</label>
          <input
            type="text"
            value={config.prefix}
            onChange={(e) => onChange({ prefix: e.target.value })}
            placeholder="e.g., Page "
            className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.suffix')}</label>
          <input
            type="text"
            value={config.suffix}
            onChange={(e) => onChange({ suffix: e.target.value })}
            placeholder="e.g., -"
            className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Style Section */}
      <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200 pt-2 border-t dark:border-gray-700">
        {tTools('pageNumbers.styleTitle')}
      </h4>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.fontSize')}</label>
          <input
            type="number"
            value={config.fontSize}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) || 12 })}
            min={6}
            max={72}
            className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.margin')}</label>
          <input
            type="number"
            value={config.margin}
            onChange={(e) => onChange({ margin: parseInt(e.target.value, 10) || 30 })}
            min={10}
            max={100}
            className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
            disabled={disabled}
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.color')}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={config.fontColor}
            onChange={(e) => onChange({ fontColor: e.target.value })}
            className="w-10 h-10 p-0.5 cursor-pointer rounded border border-gray-300 dark:border-gray-700"
            disabled={disabled}
          />
          <input
            type="text"
            value={config.fontColor}
            onChange={(e) => onChange({ fontColor: e.target.value })}
            className="flex-1 px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
            disabled={disabled}
          />
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.skipFirstPage}
          onChange={(e) => onChange({ skipFirstPage: e.target.checked })}
          className="w-3.5 h-3.5"
          disabled={disabled}
        />
        <span className="text-sm">{tTools('pageNumbers.skipFirstPage')}</span>
      </label>

      {/* Odd/Even Page Mode */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
          {tTools('pageNumbers.oddEvenTitle')}
        </h4>

        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.pageMode')}</label>
            <select
              value={config.pageMode}
              onChange={(e) => onChange({ pageMode: e.target.value as PageMode })}
              className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
              disabled={disabled}
            >
              <option value="all">{tTools('pageNumbers.modeAll')}</option>
              <option value="odd-only">{tTools('pageNumbers.modeOddOnly')}</option>
              <option value="even-only">{tTools('pageNumbers.modeEvenOnly')}</option>
              <option value="odd-even-different">{tTools('pageNumbers.modeDifferent')}</option>
            </select>
          </div>

          {config.pageMode === 'odd-even-different' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.oddPosition')}</label>
                <select
                  value={config.oddPosition}
                  onChange={(e) => onChange({ oddPosition: e.target.value as Position })}
                  className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  disabled={disabled}
                >
                  <option value="bottom-left">{tTools('pageNumbers.posBottomLeft')}</option>
                  <option value="bottom-center">{tTools('pageNumbers.posBottomCenter')}</option>
                  <option value="bottom-right">{tTools('pageNumbers.posBottomRight')}</option>
                  <option value="top-left">{tTools('pageNumbers.posTopLeft')}</option>
                  <option value="top-center">{tTools('pageNumbers.posTopCenter')}</option>
                  <option value="top-right">{tTools('pageNumbers.posTopRight')}</option>
                </select>
                <p className="text-xs text-gray-500">{tTools('pageNumbers.oddPositionHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tTools('pageNumbers.evenPosition')}</label>
                <select
                  value={config.evenPosition}
                  onChange={(e) => onChange({ evenPosition: e.target.value as Position })}
                  className="w-full px-2 py-1.5 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  disabled={disabled}
                >
                  <option value="bottom-left">{tTools('pageNumbers.posBottomLeft')}</option>
                  <option value="bottom-center">{tTools('pageNumbers.posBottomCenter')}</option>
                  <option value="bottom-right">{tTools('pageNumbers.posBottomRight')}</option>
                  <option value="top-left">{tTools('pageNumbers.posTopLeft')}</option>
                  <option value="top-center">{tTools('pageNumbers.posTopCenter')}</option>
                  <option value="top-right">{tTools('pageNumbers.posTopRight')}</option>
                </select>
                <p className="text-xs text-gray-500">{tTools('pageNumbers.evenPositionHint')}</p>
              </div>
            </div>
          )}

          {config.pageMode === 'odd-even-different' && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded text-sm text-blue-700 dark:text-blue-200">
              <p>{tTools('pageNumbers.differentModeHint')}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
