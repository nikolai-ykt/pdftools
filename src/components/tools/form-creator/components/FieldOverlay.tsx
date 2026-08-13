import React from 'react';
import { VisualField, FieldType } from '../types';
import { getFieldIcon, getFieldStyle } from '../utils/formCreatorUtils';

interface FieldOverlayProps {
  field: VisualField;
  pageSize: { width: number; height: number };
  scale: number;
  selectedFieldId: string | null;
  currentTool: FieldType | 'select';
  onFieldClick: (e: React.MouseEvent, fieldId: string) => void;
  onFieldMouseDown: (e: React.MouseEvent, fieldId: string, isResize?: boolean) => void;
}

export function FieldOverlay({
  field,
  pageSize,
  scale,
  selectedFieldId,
  currentTool,
  onFieldClick,
  onFieldMouseDown,
}: FieldOverlayProps) {
  const isSelected = field.id === selectedFieldId;

  return (
    <div
      style={getFieldStyle(field, pageSize, scale, selectedFieldId, currentTool)}
      onClick={(e) => onFieldClick(e, field.id)}
      onMouseDown={(e) => onFieldMouseDown(e, field.id)}
    >
      <span>
        {getFieldIcon(field.type)} {field.name}
      </span>

      {/* Label indicator */}
      {field.label && (
        <span
          className="absolute text-[8px] text-blue-600 bg-blue-50 px-1 rounded whitespace-nowrap"
          style={{
            ...(field.labelPosition === 'left'
              ? { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '2px' }
              : { bottom: '100%', left: 0, marginBottom: '1px' }),
          }}
        >
          {field.label}
        </span>
      )}

      {/* Resize handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
          onMouseDown={(e) => onFieldMouseDown(e, field.id, true)}
        />
      )}
    </div>
  );
}
