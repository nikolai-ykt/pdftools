import React from 'react';
import { FieldType, VisualField } from '../types';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export const generateId = () =>
  `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const getFieldIcon = (type: FieldType): string => {
  switch (type) {
    case 'text':
      return '📝';
    case 'checkbox':
      return '☑';
    case 'dropdown':
      return '▼';
    case 'radio':
      return '◉';
    case 'button':
      return '🔘';
    case 'signature':
      return '✍';
    case 'date':
      return '📅';
    case 'listbox':
      return '📋';
    default:
      return '📄';
  }
};

export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const getFieldStyle = (
  field: VisualField,
  pageSize: { width: number; height: number },
  scale: number,
  selectedFieldId: string | null,
  currentTool: string
): React.CSSProperties => {
  const pdfHeight = pageSize.height / scale;
  const screenY = (pdfHeight - field.y) * scale;

  const isSelected = field.id === selectedFieldId;

  return {
    position: 'absolute',
    left: field.x * scale,
    top: screenY - field.height * scale,
    width: field.width * scale,
    height: field.height * scale,
    border: isSelected ? '2px solid #3b82f6' : '2px dashed #6b7280',
    backgroundColor: isSelected
      ? 'rgba(59, 130, 246, 0.1)'
      : 'rgba(107, 114, 128, 0.1)',
    cursor: currentTool === 'select' ? 'move' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#374151',
    userSelect: 'none',
  };
};

export const alignFields = (
  fields: VisualField[],
  selectedIds: Set<string>,
  alignment: AlignmentType
): VisualField[] => {
  if (selectedIds.size < 2) return fields;

  const selectedFields = fields.filter((f) => selectedIds.has(f.id));
  if (selectedFields.length < 2) return fields;

  let alignValue: number;

  switch (alignment) {
    case 'left':
      alignValue = Math.min(...selectedFields.map((f) => f.x));
      break;
    case 'center': {
      const minX = Math.min(...selectedFields.map((f) => f.x));
      const maxX = Math.max(...selectedFields.map((f) => f.x + f.width));
      alignValue = (minX + maxX) / 2;
      break;
    }
    case 'right':
      alignValue = Math.max(...selectedFields.map((f) => f.x + f.width));
      break;
    case 'top':
      alignValue = Math.max(...selectedFields.map((f) => f.y));
      break;
    case 'middle': {
      const minY = Math.min(...selectedFields.map((f) => f.y - f.height));
      const maxY = Math.max(...selectedFields.map((f) => f.y));
      alignValue = (minY + maxY) / 2;
      break;
    }
    case 'bottom':
      alignValue = Math.min(...selectedFields.map((f) => f.y - f.height));
      break;
  }

  return fields.map((f) => {
    if (!selectedIds.has(f.id)) return f;

    switch (alignment) {
      case 'left':
        return { ...f, x: alignValue };
      case 'center':
        return { ...f, x: alignValue - f.width / 2 };
      case 'right':
        return { ...f, x: alignValue - f.width };
      case 'top':
        return { ...f, y: alignValue };
      case 'middle':
        return { ...f, y: alignValue + f.height / 2 };
      case 'bottom':
        return { ...f, y: alignValue + f.height };
      default:
        return f;
    }
  });
};

export const TOOL_ITEMS = [
  { type: 'select' as const, icon: '↖', labelKey: 'selectTool' },
  { type: 'text' as const, icon: '📝', labelKey: 'textFieldTool' },
  { type: 'checkbox' as const, icon: '☑', labelKey: 'checkboxTool' },
  { type: 'dropdown' as const, icon: '▼', labelKey: 'dropdownTool' },
  { type: 'radio' as const, icon: '◉', labelKey: 'radioTool' },
  { type: 'button' as const, icon: '🔘', labelKey: 'buttonTool' },
  { type: 'signature' as const, icon: '✍', labelKey: 'signatureTool' },
  { type: 'date' as const, icon: '📅', labelKey: 'dateTool' },
  { type: 'listbox' as const, icon: '📋', labelKey: 'listboxTool' },
];
