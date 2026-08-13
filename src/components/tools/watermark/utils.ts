import type { WatermarkOptions } from '@/lib/pdf/processors/watermark';
import { parsePageSelection } from '@/lib/pdf/processors/extract';
import { getImageData } from '@/lib/pdf/processors/image';
import type { WatermarkSettings, PageSelectionSettings, PageSelectionMode } from './types';

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

/**
 * Convert hex color string (#RRGGBB) to normalized RGB values (0..1)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = HEX_COLOR_REGEX.exec(hex);
  if (!match) {
    // Default fallback if hex format is invalid
    return { r: 0.53, g: 0.53, b: 0.53 };
  }

  const hexVal = match[1];
  return {
    r: parseInt(hexVal.slice(0, 2), 16) / 255,
    g: parseInt(hexVal.slice(2, 4), 16) / 255,
    b: parseInt(hexVal.slice(4, 6), 16) / 255,
  };
}

/**
 * Determine pages selection based on mode and custom range string
 */
export function getSelectedPages(
  mode: PageSelectionMode,
  range: string,
  totalPages: number
): WatermarkOptions['pages'] {
  switch (mode) {
    case 'odd':
      return 'odd';
    case 'even':
      return 'even';
    case 'custom':
      return parsePageSelection(range, totalPages);
    default:
      return 'all';
  }
}

/**
 * Build WatermarkOptions object cleanly without duplication
 */
export async function buildWatermarkOptions(
  settings: WatermarkSettings,
  pages: WatermarkOptions['pages']
): Promise<WatermarkOptions> {
  const commonOptions = {
    pages,
    repeat: settings.repeat,
    stagger: settings.stagger,
    repeatSpacingX: settings.spacingX,
    repeatSpacingY: settings.spacingY,
  };

  if (settings.type === 'text') {
    return {
      type: 'text',
      text: settings.text.trim(),
      fontSize: settings.fontSize,
      color: hexToRgb(settings.textColor),
      opacity: settings.textOpacity,
      rotation: settings.textAngle,
      ...commonOptions,
    };
  }

  if (!settings.imageFile) {
    throw new Error('Image file is required for image watermark');
  }

  const imageData = await getImageData(settings.imageFile);

  return {
    type: 'image',
    imageData,
    imageType: 'png',
    opacity: settings.imageOpacity,
    rotation: settings.imageAngle,
    ...commonOptions,
  };
}

/**
 * Centralized validation for watermark inputs
 */
export function validateWatermarkInput(params: {
  file: File | null;
  settings: WatermarkSettings;
  pageSettings: PageSelectionSettings;
}): string | null {
  if (!params.file) {
    return 'fileRequired';
  }

  if (params.settings.type === 'text' && !params.settings.text.trim()) {
    return 'enterText';
  }

  if (params.settings.type === 'image' && !params.settings.imageFile) {
    return 'selectImage';
  }

  if (params.pageSettings.mode === 'custom' && !params.pageSettings.customRange.trim()) {
    return 'rangePlaceholder';
  }

  return null;
}
