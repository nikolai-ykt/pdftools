import { useState, useRef, useCallback } from 'react';

const MAX_HISTORY = 20;

export function usePdfTextHistory() {
  const textUndoStackRef = useRef<File[]>([]);
  const textRedoStackRef = useRef<File[]>([]);
  const [textUndoCount, setTextUndoCount] = useState(0);
  const [textRedoCount, setTextRedoCount] = useState(0);

  const updateCounts = useCallback(() => {
    setTextUndoCount(textUndoStackRef.current.length);
    setTextRedoCount(textRedoStackRef.current.length);
  }, []);

  const pushHistory = useCallback(
    (previousFile: File) => {
      textUndoStackRef.current.push(previousFile);
      if (textUndoStackRef.current.length > MAX_HISTORY) {
        textUndoStackRef.current.shift(); // Remove oldest item to cap memory usage
      }
      textRedoStackRef.current = [];
      updateCounts();
    },
    [updateCounts]
  );

  const popUndo = useCallback(
    (currentFile: File): File | null => {
      if (textUndoStackRef.current.length === 0) return null;
      const previousFile = textUndoStackRef.current.pop()!;
      textRedoStackRef.current.push(currentFile);
      if (textRedoStackRef.current.length > MAX_HISTORY) {
        textRedoStackRef.current.shift();
      }
      updateCounts();
      return previousFile;
    },
    [updateCounts]
  );

  const popRedo = useCallback(
    (currentFile: File): File | null => {
      if (textRedoStackRef.current.length === 0) return null;
      const nextFile = textRedoStackRef.current.pop()!;
      textUndoStackRef.current.push(currentFile);
      if (textUndoStackRef.current.length > MAX_HISTORY) {
        textUndoStackRef.current.shift();
      }
      updateCounts();
      return nextFile;
    },
    [updateCounts]
  );

  const clearHistory = useCallback(() => {
    textUndoStackRef.current = [];
    textRedoStackRef.current = [];
    updateCounts();
  }, [updateCounts]);

  return {
    textUndoCount,
    textRedoCount,
    pushHistory,
    popUndo,
    popRedo,
    clearHistory,
  };
}
