export interface TextWordInfo {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontName: string;
  itemIdx: number;
}

export interface PageTextContent {
  rawText: string;
  words: TextWordInfo[];
  originalItems: any[];
}

export interface PDFFile {
  file: File;
  pageCount: number;
  pageTextContents: PageTextContent[];
  pagesImages: string[]; // DataURLs of rendered pages
  pageDimensions: Array<{ width: number; height: number; scale: number }>;
}

export interface DiffHighlight {
  type: 'added' | 'deleted' | 'modified' | 'moved';
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category: 'text' | 'header-footer' | 'formatting';
  movedToPageIndex?: number;
  movedToCoords?: { x: number; y: number };
}

export interface PageComparisonResult {
  pageIndex1: number; // 0-based index of original file, -1 if inserted page
  pageIndex2: number; // 0-based index of modified file, -1 if deleted page
  hasDifference: boolean;
  highlights1: DiffHighlight[]; // deleted / modified / moved source
  highlights2: DiffHighlight[]; // added / modified / moved dest
  diffPercentage: number;
}

export interface FilterPills {
  text: boolean;
  formatting: boolean;
  headerFooter: boolean;
  moved: boolean;
}
