import {
  parsePageRanges,
  createSplitEveryPage,
  createSplitByEvenOdd,
  createSplitNTimes,
  createSplitByBookmarks,
  type BookmarkInfo,
} from '@/lib/pdf';
import type { PageRange } from '@/types/pdf';

export type SplitMode = 'ranges' | 'even-odd' | 'every-page' | 'visual' | 'bookmarks' | 'n-times';

export interface CalculateSplitRangesOptions {
  splitMode: SplitMode;
  rangeInput: string;
  selectedPages: Set<number>;
  totalPages: number;
  splitCount: number;
  evenOddMode: 'odd' | 'even' | 'both';
  pdfBookmarks: BookmarkInfo[];
}

/**
 * Pure function to calculate page ranges based on current split options.
 */
export function calculateSplitRanges(options: CalculateSplitRangesOptions): PageRange[] {
  const {
    splitMode,
    rangeInput,
    selectedPages,
    totalPages,
    splitCount,
    evenOddMode,
    pdfBookmarks,
  } = options;

  if (totalPages <= 0) return [];

  switch (splitMode) {
    case 'ranges':
      if (rangeInput.trim()) {
        return parsePageRanges(rangeInput, totalPages);
      }
      // If no input but pages selected, create ranges from selection
      if (selectedPages.size > 0) {
        const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
        const ranges: PageRange[] = [];
        let start = sortedPages[0];
        let end = sortedPages[0];

        for (let i = 1; i < sortedPages.length; i++) {
          if (sortedPages[i] === end + 1) {
            end = sortedPages[i];
          } else {
            ranges.push({ start, end });
            start = sortedPages[i];
            end = sortedPages[i];
          }
        }
        ranges.push({ start, end });
        return ranges;
      }
      // Default: export all pages if no input and no selection
      return [{ start: 1, end: totalPages }];

    case 'even-odd': {
      const { odd, even } = createSplitByEvenOdd(totalPages);
      if (evenOddMode === 'odd') {
        return odd;
      } else if (evenOddMode === 'even') {
        return even;
      }
      // Both: return all odd pages as one range group, then all even pages
      return [...odd, ...even];
    }

    case 'every-page':
      return createSplitEveryPage(totalPages);

    case 'visual':
      // Visual mode uses selected pages
      if (selectedPages.size > 0) {
        return Array.from(selectedPages)
          .sort((a, b) => a - b)
          .map((p) => ({ start: p, end: p }));
      }
      return [];

    case 'bookmarks': {
      const { ranges } = createSplitByBookmarks(pdfBookmarks, totalPages);
      return ranges;
    }

    case 'n-times':
      return createSplitNTimes(totalPages, splitCount);

    default:
      return [];
  }
}
