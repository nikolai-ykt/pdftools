import type {
  PDFFile,
  PageComparisonResult,
  TextWordInfo,
  DiffHighlight
} from '../types';

/**
 * 1. Smart LCS Page Pairing dynamic programming algorithm
 */
export function smartPagePairing(file1: PDFFile, file2: PDFFile): PageComparisonResult[] {
  const N = file1.pageCount;
  const M = file2.pageCount;

  // Pre-calculate page text likeness matrix
  const similarityMatrix = Array.from({ length: N }, () => new Array(M).fill(0));
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      similarityMatrix[i][j] = computeTextSimilarity(
        file1.pageTextContents[i].rawText,
        file2.pageTextContents[j].rawText
      );
    }
  }

  // DP table for alignment
  const dp = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0));
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      // Threshold 0.25 to consider pages "matching" at all
      if (similarityMatrix[i - 1][j - 1] >= 0.25) {
        dp[i][j] = dp[i - 1][j - 1] + similarityMatrix[i - 1][j - 1];
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find paired matches
  const paired: PageComparisonResult[] = [];
  let i = N;
  let j = M;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && similarityMatrix[i - 1][j - 1] >= 0.25) {
      paired.unshift({
        pageIndex1: i - 1,
        pageIndex2: j - 1,
        hasDifference: similarityMatrix[i - 1][j - 1] < 0.999,
        highlights1: [],
        highlights2: [],
        diffPercentage: (1 - similarityMatrix[i - 1][j - 1]) * 100
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Insertion in file 2 (no match in file 1)
      paired.unshift({
        pageIndex1: -1,
        pageIndex2: j - 1,
        hasDifference: true,
        highlights1: [],
        highlights2: [],
        diffPercentage: 100
      });
      j--;
    } else {
      // Deletion in file 2 (no match in file 1)
      paired.unshift({
        pageIndex1: i - 1,
        pageIndex2: -1,
        hasDifference: true,
        highlights1: [],
        highlights2: [],
        diffPercentage: 100
      });
      i--;
    }
  }

  return paired;
}

/**
 * Text Similarity Index based on common characters proportion
 */
export function computeTextSimilarity(txt1: string, txt2: string): number {
  const clean1 = txt1.replace(/\s+/g, '');
  const clean2 = txt2.replace(/\s+/g, '');
  if (!clean1 && !clean2) return 1.0;
  if (!clean1 || !clean2) return 0.0;

  const set1 = new Set(clean1.split(''));
  let match = 0;
  clean2.split('').forEach(c => {
    if (set1.has(c)) match++;
  });

  return (match * 2) / (clean1.length + clean2.length);
}

/**
 * Word LCS Diff backtrack algorithm
 */
export function diffWordsLCS(A: string[], B: string[]) {
  const N = A.length;
  const M = B.length;
  const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0));

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (A[i - 1] === B[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: Array<{ type: 'equal' | 'added' | 'deleted'; word: string; indexA: number; indexB: number }> = [];
  let i = N;
  let j = M;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && A[i - 1] === B[j - 1]) {
      result.unshift({ type: 'equal', word: A[i - 1], indexA: i - 1, indexB: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', word: B[j - 1], indexA: -1, indexB: j - 1 });
      j--;
    } else {
      result.unshift({ type: 'deleted', word: A[i - 1], indexA: i - 1, indexB: -1 });
      i--;
    }
  }

  return result;
}

/**
 * 2. Word-level Diff on single page with Bounding Box coordinates
 */
export function diffSinglePageWords(
  words1: TextWordInfo[],
  words2: TextWordInfo[],
  pageHeight1: number,
  pageHeight2: number
): { highlights1: DiffHighlight[]; highlights2: DiffHighlight[]; hasDifference: boolean; diffPercentage: number } {
  const A = words1.map(w => w.text);
  const B = words2.map(w => w.text);

  const rawDiff = diffWordsLCS(A, B);

  const highlights1: DiffHighlight[] = [];
  const highlights2: DiffHighlight[] = [];

  let wordCountDiff = 0;

  rawDiff.forEach(item => {
    let category: 'text' | 'header-footer' | 'formatting' = 'text';

    if (item.type === 'deleted') {
      wordCountDiff++;
      const wInfo = words1[item.indexA];
      if (wInfo.y <= pageHeight1 * 0.12 || wInfo.y >= pageHeight1 * 0.88) {
        category = 'header-footer';
      }

      highlights1.push({
        type: 'deleted',
        text: item.word,
        x: wInfo.x - 1,
        y: wInfo.y - 1,
        w: wInfo.w + 2,
        h: wInfo.h + 2,
        category
      });
    } else if (item.type === 'added') {
      wordCountDiff++;
      const wInfo = words2[item.indexB];
      if (wInfo.y <= pageHeight2 * 0.12 || wInfo.y >= pageHeight2 * 0.88) {
        category = 'header-footer';
      }

      highlights2.push({
        type: 'added',
        text: item.word,
        x: wInfo.x - 1,
        y: wInfo.y - 1,
        w: wInfo.w + 2,
        h: wInfo.h + 2,
        category
      });
    } else {
      const wInfo1 = words1[item.indexA];
      const wInfo2 = words2[item.indexB];

      if (wInfo1.fontName !== wInfo2.fontName) {
        category = 'formatting';

        highlights1.push({
          type: 'modified',
          text: item.word,
          x: wInfo1.x - 1,
          y: wInfo1.y - 1,
          w: wInfo1.w + 2,
          h: wInfo1.h + 2,
          category
        });

        highlights2.push({
          type: 'modified',
          text: item.word,
          x: wInfo2.x - 1,
          y: wInfo2.y - 1,
          w: wInfo2.w + 2,
          h: wInfo2.h + 2,
          category
        });
      }
    }
  });

  const compact1 = compactAdjacentHighlights(highlights1, 'deleted');
  const compact2 = compactAdjacentHighlights(highlights2, 'added');

  const totalWords = Math.max(words1.length, words2.length, 1);
  const diffPercentage = (wordCountDiff / totalWords) * 100;

  return {
    highlights1: compact1,
    highlights2: compact2,
    hasDifference: compact1.length > 0 || compact2.length > 0,
    diffPercentage
  };
}

/**
 * Compact contiguous text highlights into single bounding boxes to save DOM render overhead
 */
export function compactAdjacentHighlights(highlights: DiffHighlight[], type: 'added' | 'deleted' | 'modified'): DiffHighlight[] {
  if (highlights.length === 0) return [];

  const result: DiffHighlight[] = [];
  let current = { ...highlights[0] };

  for (let i = 1; i < highlights.length; i++) {
    const next = highlights[i];

    const sameLine = Math.abs(next.y - current.y) < 5;
    const contiguous = Math.abs(next.x - (current.x + current.w)) < 15;

    if (sameLine && contiguous && next.category === current.category && next.type === current.type) {
      current.w = (next.x + next.w) - current.x;
      current.text += next.text;
    } else {
      result.push(current);
      current = { ...next };
    }
  }
  result.push(current);
  return result;
}

/**
 * 3. Cross-correlation Moved-Text Segment detector
 */
export function findMovedTextSegments(pairedList: PageComparisonResult[]) {
  pairedList.forEach(pair1 => {
    if (pair1.highlights1.length === 0) return;

    pair1.highlights1.forEach(hl1 => {
      if (hl1.type !== 'deleted' || hl1.text.trim().length < 5) return;

      pairedList.forEach(pair2 => {
        if (pair2.highlights2.length === 0) return;

        pair2.highlights2.forEach(hl2 => {
          if (hl2.type !== 'added' || hl2.text.trim().length < 5) return;

          const matchSim = computeTextSimilarity(hl1.text, hl2.text);

          if (matchSim >= 0.85) {
            hl1.type = 'moved';
            hl2.type = 'moved';
            hl1.movedToPageIndex = pair2.pageIndex2;
            hl1.movedToCoords = { x: hl2.x, y: hl2.y };

            hl2.movedToPageIndex = pair1.pageIndex1;
            hl2.movedToCoords = { x: hl1.x, y: hl1.y };
          }
        });
      });
    });
  });
}
