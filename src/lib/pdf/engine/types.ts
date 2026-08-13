export interface PyodideFS {
  writeFile(path: string, data: Uint8Array | string): void;
  unlink(path: string): void;
  readFile(path: string, options?: { encoding?: string }): Uint8Array;
}

export interface PyodideInterface {
  FS: PyodideFS;
  runPython(code: string): any;
  runPythonAsync(code: string): Promise<any>;
  loadPackage(url: string): Promise<void>;
  globals: {
    get(name: string): any;
    set(name: string, value: any): void;
  };
}

export interface PdfToPdfaOptions {
  level?: string;
  embedFonts?: boolean;
  flattenTransparency?: boolean;
}

export interface HtmlAttachment {
  filename: string;
  contentType?: string;
  content?: Uint8Array | ArrayBuffer;
}

export interface HtmlToPdfOptions {
  pageSize?: 'a4' | 'letter' | 'legal' | string;
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  attachments?: HtmlAttachment[];
}

export interface DeskewOptions {
  threshold?: number;
  dpi?: number;
}

export interface DeskewDetail {
  totalPages: number;
  correctedPages: number;
  angles: number[];
  corrected: boolean[];
}

export interface DeskewResult {
  pdf: Blob;
  result: DeskewDetail;
}

export interface FontToOutlineOptions {
  dpi?: number;
  preserveSelectableText?: boolean;
  pageRange?: string;
}

export interface FontOutlineResult {
  pdf: Blob;
  fontsConverted: number;
  pagesProcessed: number;
  totalPages: number;
}

export interface OCGLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface ToggleOCGOptions {
  layerId: string;
  visible: boolean;
}

export interface AddOCGOptions {
  name: string;
}

export interface DeleteOCGOptions {
  layerId?: string;
}

export interface RenameOCGOptions {
  layerId?: string;
  name?: string;
}

export interface CompressOptions {
  quality?: 'low' | 'medium' | 'high' | 'maximum';
  removeMetadata?: boolean;
}

export interface PhotonCompressOptions {
  dpi?: number;
  format?: 'jpeg' | 'png';
  quality?: number;
}

export interface TextMatchInput {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
}

export type TextFitMode = 'preserve' | 'shrink' | 'expand';

export interface ReplaceTextDiagnostics {
  usedFallbackFont: boolean;
  overflowDetected: boolean;
  hasDigitalSignatures: boolean;
}

export interface ReplaceTextResult {
  blob: Blob;
  diagnostics: ReplaceTextDiagnostics;
}

export interface PdfRange {
  start: number;
  end: number;
}

export interface PyMuPDFEngine {
  pyodide: PyodideInterface;

  pdfToDocx(file: File): Promise<Blob>;
  pdfToPdfa(file: File, options?: PdfToPdfaOptions): Promise<{ pdf: Blob }>;
  htmlToPdf(html: string, options?: HtmlToPdfOptions): Promise<Blob>;
  deskewPdf(file: File, options?: DeskewOptions): Promise<DeskewResult>;
  fontToOutline(file: File, options?: FontToOutlineOptions): Promise<FontOutlineResult>;

  getOCGLayers(file: File): Promise<OCGLayer[]>;
  toggleOCGLayer(file: File, options: ToggleOCGOptions): Promise<{ pdf: Blob }>;
  addOCGLayer(file: File, options: AddOCGOptions): Promise<{ pdf: Blob; layerId: string }>;
  deleteOCGLayer(file: File, options?: DeleteOCGOptions): Promise<{ pdf: Blob }>;
  renameOCGLayer(file: File, options?: RenameOCGOptions): Promise<{ pdf: Blob }>;

  compress(file: File, options?: CompressOptions): Promise<Blob>;
  photonCompress(file: File, options?: PhotonCompressOptions): Promise<Blob>;
  extractPages(file: File, pages: number[]): Promise<Blob>;
  replaceExistingText(
    file: File,
    matches: TextMatchInput[],
    replacementText: string,
    fitMode?: TextFitMode
  ): Promise<ReplaceTextResult>;
  splitPdf(file: File, ranges: PdfRange[]): Promise<Blob[]>;
}
