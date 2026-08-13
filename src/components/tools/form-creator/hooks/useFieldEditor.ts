import { useState, useCallback, useEffect } from 'react';
import { VisualField, FieldType } from '../types';
import { alignFields, AlignmentType } from '../utils/formCreatorUtils';
import { createNewVisualField } from '../utils/fieldUtils';
import { useHistory } from './useHistory';

export function useFieldEditor(file: File | null, currentPage: number) {
  const [fields, setFields] = useState<VisualField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<Set<string>>(new Set());
  const [currentTool, setCurrentTool] = useState<FieldType | 'select'>('select');

  const { historyIndex, historyLength, canUndo, canRedo, pushHistory, undo, redo, resetHistory } = useHistory();

  // Wrap setFields and push to history
  const updateFieldsWithHistory = useCallback(
    (newFieldsOrUpdater: VisualField[] | ((prev: VisualField[]) => VisualField[])) => {
      setFields((prev) => {
        const next = typeof newFieldsOrUpdater === 'function' ? newFieldsOrUpdater(prev) : newFieldsOrUpdater;
        pushHistory(next);
        return next;
      });
    },
    [pushHistory]
  );

  const handleUndo = useCallback(() => {
    undo((previousFields) => {
      setFields(previousFields);
      setSelectedFieldId(null);
      setSelectedFieldIds(new Set());
    });
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo((nextFields) => {
      setFields(nextFields);
      setSelectedFieldId(null);
      setSelectedFieldIds(new Set());
    });
  }, [redo]);

  const addFieldAt = useCallback(
    (type: FieldType, x: number, pdfY: number, pageNum: number) => {
      setFields((prev) => {
        const newField = createNewVisualField(type, x, pdfY, pageNum, prev.filter((f) => f.type === type).length);
        const nextFields = [...prev, newField];
        pushHistory(nextFields);
        setSelectedFieldId(newField.id);
        setCurrentTool('select');
        return nextFields;
      });
    },
    [pushHistory]
  );

  const addFields = useCallback(
    (newFields: VisualField[]) => {
      setFields((prev) => {
        const combined = [...prev, ...newFields];
        pushHistory(combined);
        return combined;
      });
    },
    [pushHistory]
  );

  const updateSelectedField = useCallback(
    (updates: Partial<VisualField>) => {
      if (!selectedFieldId) return;
      setFields((prev) =>
        prev.map((f) => (f.id === selectedFieldId ? { ...f, ...updates } : f))
      );
    },
    [selectedFieldId]
  );

  const handleDeleteField = useCallback(() => {
    if (!selectedFieldId) return;
    setFields((prev) => {
      const next = prev.filter((f) => f.id !== selectedFieldId);
      pushHistory(next);
      return next;
    });
    setSelectedFieldId(null);
  }, [selectedFieldId, pushHistory]);

  const handleDuplicateField = useCallback(() => {
    if (!selectedFieldId) return;
    setFields((prev) => {
      const target = prev.find((f) => f.id === selectedFieldId);
      if (!target) return prev;

      const duplicated: VisualField = {
        ...target,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${target.name}_copy`,
        x: target.x + 20,
        y: target.y - 20,
      };

      const next = [...prev, duplicated];
      pushHistory(next);
      setSelectedFieldId(duplicated.id);
      return next;
    });
  }, [selectedFieldId, pushHistory]);

  const toggleFieldSelection = useCallback((fieldId: string, ctrlKey: boolean) => {
    if (ctrlKey) {
      setSelectedFieldIds((prev) => {
        const next = new Set(prev);
        if (next.has(fieldId)) {
          next.delete(fieldId);
        } else {
          next.add(fieldId);
        }
        return next;
      });
    } else {
      setSelectedFieldIds(new Set([fieldId]));
      setSelectedFieldId(fieldId);
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    setFields((prev) => {
      const pageFieldIds = prev.filter((f) => f.pageNumber === currentPage).map((f) => f.id);
      setSelectedFieldIds(new Set(pageFieldIds));
      return prev;
    });
  }, [currentPage]);

  const handleAlignFields = useCallback(
    (alignment: AlignmentType) => {
      setFields((prev) => {
        const selectedIds: Set<string> =
          selectedFieldIds.size > 1
            ? selectedFieldIds
            : selectedFieldId
            ? new Set<string>([selectedFieldId])
            : new Set<string>();

        const aligned = alignFields(prev, selectedIds, alignment);
        if (aligned !== prev) {
          pushHistory(aligned);
        }
        return aligned;
      });
    },
    [selectedFieldId, selectedFieldIds, pushHistory]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!file) return;

      // Ctrl+Z: Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Ctrl+Y: Redo
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+D: Duplicate
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        handleDuplicateField();
      }
      // Ctrl+A: Select all
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      // Delete: Delete selected field
      if (e.key === 'Delete' && selectedFieldId) {
        e.preventDefault();
        handleDeleteField();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, handleUndo, handleRedo, handleDuplicateField, handleSelectAll, handleDeleteField, selectedFieldId]);

  return {
    fields,
    setFields,
    selectedFieldId,
    setSelectedFieldId,
    selectedFieldIds,
    setSelectedFieldIds,
    currentTool,
    setCurrentTool,
    canUndo,
    canRedo,
    historyIndex,
    historyLength,
    handleUndo,
    handleRedo,
    addFieldAt,
    addFields,
    updateSelectedField,
    handleDeleteField,
    handleDuplicateField,
    toggleFieldSelection,
    handleSelectAll,
    handleAlignFields,
    resetHistory,
    updateFieldsWithHistory,
  };
}
