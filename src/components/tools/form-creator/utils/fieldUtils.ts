import { FieldType, VisualField } from '../types';
import { generateId } from './formCreatorUtils';

export const DEFAULT_FIELD_SIZES: Record<FieldType, { width: number; height: number }> = {
  text: { width: 200, height: 24 },
  checkbox: { width: 20, height: 20 },
  dropdown: { width: 200, height: 24 },
  radio: { width: 20, height: 20 },
  button: { width: 100, height: 30 },
  signature: { width: 200, height: 60 },
  date: { width: 150, height: 24 },
  listbox: { width: 200, height: 80 },
};

export function createNewVisualField(
  type: FieldType,
  x: number,
  y: number,
  pageNumber: number,
  existingFieldsCount: number
): VisualField {
  const defaultSize = DEFAULT_FIELD_SIZES[type] || { width: 150, height: 24 };

  return {
    id: generateId(),
    type,
    name: `${type}_${existingFieldsCount + 1}`,
    pageNumber,
    x,
    y,
    width: defaultSize.width,
    height: defaultSize.height,
    options: ['dropdown', 'radio', 'listbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    buttonLabel: type === 'button' ? 'Submit' : undefined,
    signatureLabel: type === 'signature' ? 'Sign here' : undefined,
    dateFormat: type === 'date' ? 'YYYY-MM-DD' : undefined,
    multiSelect: type === 'listbox' ? false : undefined,
  };
}
