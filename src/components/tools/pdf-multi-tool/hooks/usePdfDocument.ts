import { useState, useCallback, useReducer } from 'react';
import type { PdfPage, PdfSource, HistoryState } from '../types';
import { loadPdfPreviews } from '../services/pdfService';

interface DocumentState {
  pages: PdfPage[];
  sources: PdfSource[];
  history: HistoryState[];
  historyIndex: number;
}

type Action =
  | { type: 'SET_STATE'; pages: PdfPage[]; sources: PdfSource[] }
  | { type: 'ADD_SOURCES_AND_PAGES'; newSource: PdfSource; newPages: PdfPage[] }
  | { type: 'UPDATE_PAGES'; pages: PdfPage[]; skipHistory?: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' };

const MAX_HISTORY = 30;

function clonePages(pages: PdfPage[]): PdfPage[] {
  return pages.map(p => ({ ...p }));
}

function documentReducer(state: DocumentState, action: Action): DocumentState {
  switch (action.type) {
    case 'SET_STATE': {
      const cloned = clonePages(action.pages);
      return {
        pages: cloned,
        sources: action.sources,
        history: [{ pages: clonePages(cloned) }],
        historyIndex: 0,
      };
    }

    case 'ADD_SOURCES_AND_PAGES': {
      const nextPages = [...state.pages, ...action.newPages];
      const nextSources = [...state.sources, action.newSource];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ pages: clonePages(nextPages) });
      const trimmedHistory = newHistory.slice(-MAX_HISTORY);

      return {
        pages: nextPages,
        sources: nextSources,
        history: trimmedHistory,
        historyIndex: trimmedHistory.length - 1,
      };
    }

    case 'UPDATE_PAGES': {
      if (action.skipHistory) {
        return { ...state, pages: action.pages };
      }
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ pages: clonePages(action.pages) });
      const trimmedHistory = newHistory.slice(-MAX_HISTORY);

      return {
        ...state,
        pages: action.pages,
        history: trimmedHistory,
        historyIndex: trimmedHistory.length - 1,
      };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const prevIndex = state.historyIndex - 1;
      return {
        ...state,
        pages: clonePages(state.history[prevIndex].pages),
        historyIndex: prevIndex,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextIndex = state.historyIndex + 1;
      return {
        ...state,
        pages: clonePages(state.history[nextIndex].pages),
        historyIndex: nextIndex,
      };
    }

    case 'RESET': {
      return {
        pages: [],
        sources: [],
        history: [],
        historyIndex: -1,
      };
    }

    default:
      return state;
  }
}

export function usePdfDocument() {
  const [docState, dispatch] = useReducer(documentReducer, {
    pages: [],
    sources: [],
    history: [],
    historyIndex: -1,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add files
  const addFiles = useCallback(async (files: File[]) => {
    setIsLoadingPreviews(true);
    setError(null);

    try {
      for (const file of files) {
        const { source, pages, thumbnails: newThumbs } = await loadPdfPreviews(file);

        setThumbnails(prev => {
          const nextMap = new Map(prev);
          newThumbs.forEach((val, key) => nextMap.set(key, val));
          return nextMap;
        });

        dispatch({
          type: 'ADD_SOURCES_AND_PAGES',
          newSource: source,
          newPages: pages,
        });
      }
    } catch (err) {
      console.error('Failed to load PDF preview:', err);
      setError('LOAD_FAILED');
    } finally {
      setIsLoadingPreviews(false);
    }
  }, []);

  // Selection
  const selectPage = useCallback((id: string, multiSelect = false) => {
    setSelectedIds(prev => {
      const next = new Set(multiSelect ? prev : []);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(docState.pages.map(p => p.id)));
  }, [docState.pages]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Rotate single page
  const rotatePage = useCallback((id: string, degrees: number) => {
    const updated = docState.pages.map(page => {
      if (page.id === id) {
        return { ...page, rotation: (page.rotation + degrees + 360) % 360 };
      }
      return page;
    });
    dispatch({ type: 'UPDATE_PAGES', pages: updated });
  }, [docState.pages]);

  // Rotate selected pages
  const rotateSelected = useCallback((degrees: number) => {
    if (selectedIds.size === 0) return;
    const updated = docState.pages.map(page => {
      if (selectedIds.has(page.id)) {
        return { ...page, rotation: (page.rotation + degrees + 360) % 360 };
      }
      return page;
    });
    dispatch({ type: 'UPDATE_PAGES', pages: updated });
  }, [docState.pages, selectedIds]);

  // Delete single page
  const deletePage = useCallback((id: string) => {
    if (docState.pages.length <= 1) {
      setError('DELETE_ALL_PAGES');
      return;
    }
    setError(null);
    const updated = docState.pages.filter(p => p.id !== id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    dispatch({ type: 'UPDATE_PAGES', pages: updated });
  }, [docState.pages]);

  // Delete selected pages
  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (selectedIds.size >= docState.pages.length) {
      setError('DELETE_ALL_PAGES');
      return;
    }
    setError(null);
    const updated = docState.pages.filter(p => !selectedIds.has(p.id));
    setSelectedIds(new Set());
    dispatch({ type: 'UPDATE_PAGES', pages: updated });
  }, [docState.pages, selectedIds]);

  // Duplicate single page
  const duplicatePage = useCallback((id: string) => {
    const index = docState.pages.findIndex(p => p.id === id);
    if (index === -1) return;

    const original = docState.pages[index];
    const newId = crypto.randomUUID();
    const copy: PdfPage = { ...original, id: newId };

    // Copy thumbnail reference if available
    const existingThumb = thumbnails.get(id);
    if (existingThumb) {
      setThumbnails(prev => new Map(prev).set(newId, existingThumb));
    }

    const updated = [...docState.pages];
    updated.splice(index + 1, 0, copy);
    dispatch({ type: 'UPDATE_PAGES', pages: updated });
  }, [docState.pages, thumbnails]);

  // Duplicate selected pages
  const duplicateSelected = useCallback(() => {
    if (selectedIds.size === 0) return;

    const updated: PdfPage[] = [];
    const newThumbnailsMap = new Map(thumbnails);

    docState.pages.forEach(page => {
      updated.push(page);
      if (selectedIds.has(page.id)) {
        const newId = crypto.randomUUID();
        const copy: PdfPage = { ...page, id: newId };
        updated.push(copy);

        const thumb = thumbnails.get(page.id);
        if (thumb) {
          newThumbnailsMap.set(newId, thumb);
        }
      }
    });

    setThumbnails(newThumbnailsMap);
    dispatch({ type: 'UPDATE_PAGES', pages: updated });
  }, [docState.pages, selectedIds, thumbnails]);

  // Add blank pages
  const addBlankPages = useCallback((position: number, count: number) => {
    const newBlankPages: PdfPage[] = [];
    for (let i = 0; i < count; i++) {
      newBlankPages.push({
        id: crypto.randomUUID(),
        sourceFileId: null,
        originalPageNumber: null,
        rotation: 0,
        isBlank: true,
      });
    }

    const insertIndex = Math.max(0, Math.min(position - 1, docState.pages.length));
    const updated = [...docState.pages];
    updated.splice(insertIndex, 0, ...newBlankPages);

    dispatch({ type: 'UPDATE_PAGES', pages: updated });
  }, [docState.pages]);

  // Move page (Drag & Drop)
  const movePage = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...docState.pages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    dispatch({ type: 'UPDATE_PAGES', pages: updated });
  }, [docState.pages]);

  // History controls
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    setSelectedIds(new Set());
    setThumbnails(new Map());
    setError(null);
  }, []);

  return {
    pages: docState.pages,
    sources: docState.sources,
    selectedIds,
    thumbnails,
    isLoadingPreviews,
    error,
    setError,

    canUndo: docState.historyIndex > 0,
    canRedo: docState.historyIndex < docState.history.length - 1,

    addFiles,
    selectPage,
    selectAll,
    deselectAll,
    rotatePage,
    rotateSelected,
    deletePage,
    deleteSelected,
    duplicatePage,
    duplicateSelected,
    addBlankPages,
    movePage,
    undo,
    redo,
    reset,
  };
}
