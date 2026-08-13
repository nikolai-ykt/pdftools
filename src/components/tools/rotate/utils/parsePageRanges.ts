/**
 * Parse custom page range strings like "1, 3, 5-10" into a set of 1-based page numbers.
 */
export function parsePageRanges(input: string, totalPages: number): Set<number> {
  const pages = new Set<number>();
  if (!input.trim() || totalPages <= 0) return pages;

  const parts = input.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) {
            pages.add(i);
          }
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pages.add(num);
      }
    }
  }

  return pages;
}
