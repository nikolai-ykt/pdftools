/**
 * PDF Numbering & Text Formatters
 */

/**
 * Convert a positive integer to Roman numerals.
 */
export function toRoman(num: number): string {
  if (num <= 0) return String(num);

  const romanNumerals: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let result = '';
  let n = Math.floor(num);

  for (const [value, symbol] of romanNumerals) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }

  return result;
}

export type NumberFormatType = 'number' | 'roman' | 'page-of-total' | 'custom';

export interface FormatPageNumberOptions {
  format: NumberFormatType;
  customFormat?: string;
  startNumber?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Format a page number string based on formatting options.
 */
export function formatPageNumber(
  page: number,
  total: number,
  options: FormatPageNumberOptions
): string {
  const {
    format = 'number',
    customFormat = 'Page {page} of {total}',
    startNumber = 1,
    prefix = '',
    suffix = '',
  } = options;

  const adjustedPage = page - 1 + startNumber;
  const adjustedTotal = total - 1 + startNumber;
  let text = '';

  switch (format) {
    case 'number':
      text = String(adjustedPage);
      break;
    case 'roman':
      text = toRoman(adjustedPage);
      break;
    case 'page-of-total':
      text = `Page ${adjustedPage} of ${adjustedTotal}`;
      break;
    case 'custom':
      text = customFormat
        .replace(/{page}/g, String(adjustedPage))
        .replace(/{total}/g, String(adjustedTotal));
      break;
    default:
      text = String(adjustedPage);
  }

  return `${prefix}${text}${suffix}`;
}
