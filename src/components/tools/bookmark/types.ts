export interface BookmarkNode {
  id: string;
  title: string;
  pageNumber: number;
  children: BookmarkNode[];
  color?: string;
  style?: 'bold' | 'italic' | 'bold-italic';
  isExpanded?: boolean;
}

export type DropPosition = 'before' | 'after' | 'inside' | null;
