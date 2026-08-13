export interface PagePreview {
  pageNumber: number;
  thumbnail?: string;
  rotation: number;
}

export type CalibrationTab = 'preset' | 'stepless';

/**
 * 角度标准化函数，将任意浮点数转换为 [-180, 180] 范围
 */
export const normalizeInputAngle = (value: string | number, fallbackValue: number = 0): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(parsed)) return fallbackValue;

  let angle = parsed % 360;
  if (angle > 180) angle -= 360;
  if (angle <= -180) angle += 360;

  return Math.round(angle * 10) / 10; // 保留一位小数
};
