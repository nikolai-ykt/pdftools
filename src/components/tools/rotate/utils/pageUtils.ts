/**
 * Create a Set containing all 1-based page numbers from 1 to totalPages.
 */
export function createPageSet(totalPages: number): Set<number> {
  if (totalPages <= 0) return new Set();
  return new Set(Array.from({ length: totalPages }, (_, i) => i + 1));
}

/**
 * Helper to get target pages to apply rotation to.
 * Returns selectedPages if non-empty, otherwise returns all pages (1..totalPages).
 */
export function getTargetPages(selectedPages: Set<number>, totalPages: number): Set<number> {
  return selectedPages.size > 0 ? selectedPages : createPageSet(totalPages);
}
