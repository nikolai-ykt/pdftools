export type Position =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right';

export type Format = 'number' | 'roman' | 'page-of-total' | 'custom';

export type PageMode = 'all' | 'odd-only' | 'even-only' | 'odd-even-different';

export interface PageNumbersConfig {
  position: Position;
  format: Format;
  customFormat: string;
  startNumber: number;
  fontSize: number;
  fontColor: string;
  margin: number;
  skipFirstPage: boolean;
  prefix: string;
  suffix: string;
  pageMode: PageMode;
  oddPosition: Position;
  evenPosition: Position;
}

export const DEFAULT_PAGE_NUMBERS_CONFIG: PageNumbersConfig = {
  position: 'bottom-center',
  format: 'number',
  customFormat: 'Page {page} of {total}',
  startNumber: 1,
  fontSize: 12,
  fontColor: '#000000',
  margin: 30,
  skipFirstPage: false,
  prefix: '',
  suffix: '',
  pageMode: 'all',
  oddPosition: 'bottom-right',
  evenPosition: 'bottom-left',
};
