export type WatermarkType = 'text' | 'image';
export type PageSelectionMode = 'all' | 'odd' | 'even' | 'custom';

export interface WatermarkSettings {
  type: WatermarkType;

  // Text watermark state
  text: string;
  fontSize: number;
  textColor: string;
  textOpacity: number;
  textAngle: number;

  // Image watermark state
  imageFile: File | null;
  imageOpacity: number;
  imageAngle: number;

  // Repeat/tiling watermark state
  repeat: boolean;
  stagger: boolean;
  spacingX: number;
  spacingY: number;
}

export interface PageSelectionSettings {
  mode: PageSelectionMode;
  customRange: string;
}

export interface WatermarkToolProps {
  className?: string;
}
