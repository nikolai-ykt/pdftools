import { useState, useCallback, useEffect } from 'react';
import { VisualField, FieldType, SavedProject } from '../types';

const SAVED_PROJECTS_KEY = 'pdfcraft_form_creator_projects';
const MAX_HISTORY_LENGTH = 50;

export function useFormCreatorState() {
  const [fields, setFields] = useState<VisualField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<Set<string>>(new Set());
  const [currentTool, setCurrentTool] = useState<FieldType | 'select'>('select');

  // Undo/Redo history
  const [history, setHistory] = useState<VisualField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Saved projects
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  // Load saved projects from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_PROJECTS_KEY);
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved projects:', e);
    }
  }, []);

  // Save projects to localStorage
  const persistSavedProjects = useCallback((projects: SavedProject[]) => {
    setSavedProjects(projects);
    try {
      localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects:', e);
    }
  }, []);

  // Push new state to history
  const pushHistory = useCallback(
    (newFields: VisualField[]) => {
      setHistory((prev) => {
        const nextHistory = prev.slice(0, historyIndex + 1);
        if (nextHistory.length >= MAX_HISTORY_LENGTH) {
          nextHistory.shift();
        }
        return [...nextHistory, JSON.parse(JSON.stringify(newFields))];
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_LENGTH - 1));
    },
    [historyIndex]
  );

  // Undo action
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevFields = history[historyIndex - 1];
      setFields(JSON.parse(JSON.stringify(prevFields)));
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  // Redo action
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextFields = history[historyIndex + 1];
      setFields(JSON.parse(JSON.stringify(nextFields)));
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

  return {
    fields,
    setFields,
    selectedFieldId,
    setSelectedFieldId,
    selectedFieldIds,
    setSelectedFieldIds,
    currentTool,
    setCurrentTool,
    pushHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    savedProjects,
    persistSavedProjects,
  };
}
