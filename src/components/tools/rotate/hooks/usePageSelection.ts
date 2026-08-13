'use client';

import { useState, useCallback } from 'react';
import { createPageSet } from '../utils/pageUtils';
import { parsePageRanges } from '../utils/parsePageRanges';

export function usePageSelection(totalPages: number) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [customPageInput, setCustomPageInput] = useState<string>('');

  const resetSelection = useCallback(() => {
    setSelectedPages(new Set());
    setCustomPageInput('');
  }, []);

  const handleToggleSelectPage = useCallback((pageNum: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedPages(createPageSet(totalPages));
  }, [totalPages]);

  const handleClearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const handleSelectOdd = useCallback(() => {
    const odds = Array.from({ length: totalPages }, (_, i) => i + 1).filter(num => num % 2 !== 0);
    setSelectedPages(new Set(odds));
  }, [totalPages]);

  const handleSelectEven = useCallback(() => {
    const evens = Array.from({ length: totalPages }, (_, i) => i + 1).filter(num => num % 2 === 0);
    setSelectedPages(new Set(evens));
  }, [totalPages]);

  const handleApplyCustomPages = useCallback(() => {
    const pages = parsePageRanges(customPageInput, totalPages);
    if (pages.size > 0) {
      setSelectedPages(pages);
    }
  }, [customPageInput, totalPages]);

  return {
    selectedPages,
    setSelectedPages,
    customPageInput,
    setCustomPageInput,
    handleToggleSelectPage,
    handleSelectAll,
    handleClearSelection,
    handleSelectOdd,
    handleSelectEven,
    handleApplyCustomPages,
    resetSelection,
  };
}
