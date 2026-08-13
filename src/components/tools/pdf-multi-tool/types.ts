export interface PdfSource {
  id: string;
  file: File;
  name: string;
  pageCount: number;
}

export interface PdfPage {
  id: string;
  sourceFileId: string | null;
  originalPageNumber: number | null;
  rotation: number;
  isBlank: boolean;
}

export interface HistoryState {
  pages: PdfPage[];
}

export type ProcessingStatus = 'idle' | 'processing' | 'complete' | 'error';

export interface BlankPageOptions {
  position: number;
  count: number;
}

export interface PDFMultiToolProps {
  className?: string;
}
