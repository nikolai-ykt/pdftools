import { useState, useCallback } from 'react';
import { VisualField } from '../types';

const MAX_HISTORY_LENGTH = 50;

export function useHistory() {
  const [history, setHistory] = useState<VisualField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const pushHistory = useCallback((newFields: VisualField[]) => {
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      nextHistory.push(newFields.map((f) => ({ ...f })));
      if (nextHistory.length > MAX_HISTORY_LENGTH) {
        nextHistory.shift();
      }
      return nextHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_LENGTH - 1));
  }, [historyIndex]);

  const undo = useCallback(
    (onUndo: (fields: VisualField[]) => void) => {
      if (historyIndex > 0) {
        const targetIndex = historyIndex - 1;
        setHistoryIndex(targetIndex);
        onUndo(history[targetIndex].map((f) => ({ ...f })));
      }
    },
    [historyIndex, history]
  );

  const redo = useCallback(
    (onRedo: (fields: VisualField[]) => void) => {
      if (historyIndex < history.length - 1) {
        const targetIndex = historyIndex + 1;
        setHistoryIndex(targetIndex);
        onRedo(history[targetIndex].map((f) => ({ ...f })));
      }
    },
    [historyIndex, history]
  );

  const resetHistory = useCallback((initialFields: VisualField[] = []) => {
    setHistory([initialFields.map((f) => ({ ...f }))]);
    setHistoryIndex(0);
  }, []);

  return {
    historyIndex,
    historyLength: history.length,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    pushHistory,
    undo,
    redo,
    resetHistory,
  };
}
