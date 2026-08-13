import { useState, useCallback, useEffect } from 'react';
import { VisualField, FieldType } from '../types';

export function useFieldDrag(
  fields: VisualField[],
  setFields: React.Dispatch<React.SetStateAction<VisualField[]>>,
  selectedFieldId: string | null,
  setSelectedFieldId: (id: string | null) => void,
  currentTool: FieldType | 'select',
  scale: number
) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleFieldMouseDown = useCallback(
    (e: React.MouseEvent, fieldId: string, isResize: boolean = false) => {
      e.stopPropagation();
      e.preventDefault();

      if (currentTool !== 'select') return;

      const field = fields.find((f) => f.id === fieldId);
      if (!field) return;

      setSelectedFieldId(fieldId);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragOffset({ x: field.x, y: field.y });

      if (isResize) {
        setIsResizing(true);
      } else {
        setIsDragging(true);
      }
    },
    [currentTool, fields, setSelectedFieldId]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      if (!selectedFieldId) return;

      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;

      setFields((prev) =>
        prev.map((field) => {
          if (field.id !== selectedFieldId) return field;

          if (isResizing) {
            return {
              ...field,
              width: Math.max(20, field.width + deltaX),
              height: Math.max(20, field.height + deltaY),
            };
          } else {
            return {
              ...field,
              x: dragOffset.x + deltaX,
              y: dragOffset.y - deltaY,
            };
          }
        })
      );

      setDragStart({ x: e.clientX, y: e.clientY });
      if (!isResizing) {
        setDragOffset((prev) => ({ x: prev.x + deltaX, y: prev.y - deltaY }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedFieldId, dragStart, dragOffset, scale, setFields]);

  return {
    isDragging,
    isResizing,
    handleFieldMouseDown,
  };
}
