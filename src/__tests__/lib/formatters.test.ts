import { describe, it, expect } from 'vitest';
import { toRoman, formatPageNumber } from '@/lib/pdf/utils/formatters';

describe('formatters', () => {
  describe('toRoman', () => {
    it('should correctly convert numbers to Roman numerals', () => {
      expect(toRoman(1)).toBe('I');
      expect(toRoman(4)).toBe('IV');
      expect(toRoman(9)).toBe('IX');
      expect(toRoman(14)).toBe('XIV');
      expect(toRoman(40)).toBe('XL');
      expect(toRoman(90)).toBe('XC');
      expect(toRoman(2024)).toBe('MMXXIV');
    });

    it('should return number as string if non-positive', () => {
      expect(toRoman(0)).toBe('0');
      expect(toRoman(-5)).toBe('-5');
    });
  });

  describe('formatPageNumber', () => {
    it('should format standard numbers', () => {
      expect(formatPageNumber(1, 10, { format: 'number' })).toBe('1');
      expect(formatPageNumber(5, 10, { format: 'number', startNumber: 3 })).toBe('7');
    });

    it('should format roman numerals', () => {
      expect(formatPageNumber(3, 10, { format: 'roman' })).toBe('III');
    });

    it('should format page-of-total', () => {
      expect(formatPageNumber(2, 5, { format: 'page-of-total' })).toBe('Page 2 of 5');
    });

    it('should format custom templates with prefix and suffix', () => {
      expect(
        formatPageNumber(2, 5, {
          format: 'custom',
          customFormat: '{page}/{total}',
          prefix: '[',
          suffix: ']',
        })
      ).toBe('[2/5]');
    });
  });
});
