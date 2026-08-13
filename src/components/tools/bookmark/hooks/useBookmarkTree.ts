import { useState, useCallback } from 'react';
import type { BookmarkNode, DropPosition } from '../types';

export function useBookmarkTree(currentPage: number) {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkNode | null>(null);

  // DnD state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);

  const handleBookmarkClick = useCallback((bookmark: BookmarkNode, onNavigatePage?: (page: number) => void) => {
    setSelectedBookmarkId(bookmark.id);
    if (onNavigatePage) {
      onNavigatePage(bookmark.pageNumber);
    }
  }, []);

  const handleAddBookmark = useCallback(() => {
    const newBookmark: BookmarkNode = {
      id: `bm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `New Bookmark (Page ${currentPage})`,
      pageNumber: currentPage,
      children: [],
      isExpanded: true,
    };
    setBookmarks(prev => [...prev, newBookmark]);
    setEditingBookmark(newBookmark);
  }, [currentPage]);

  const handleAddChild = useCallback((parentId: string) => {
    const newChild: BookmarkNode = {
      id: `bm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `New Bookmark (Page ${currentPage})`,
      pageNumber: currentPage,
      children: [],
      isExpanded: true,
    };

    const addChildTo = (nodes: BookmarkNode[]): BookmarkNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...node.children, newChild], isExpanded: true };
        }
        return { ...node, children: addChildTo(node.children) };
      });
    };

    setBookmarks(prev => addChildTo(prev));
    setEditingBookmark(newChild);
  }, [currentPage]);

  const handleDeleteBookmark = useCallback((id: string) => {
    const removeFrom = (nodes: BookmarkNode[]): BookmarkNode[] => {
      return nodes
        .filter(node => node.id !== id)
        .map(node => ({ ...node, children: removeFrom(node.children) }));
    };

    setBookmarks(prev => removeFrom(prev));
    setSelectedBookmarkId(prev => (prev === id ? null : prev));
  }, []);

  const handleUpdateBookmark = useCallback((updated: BookmarkNode) => {
    const pageNum = typeof updated.pageNumber === 'string' ? 1 : (updated.pageNumber || 1);
    const finalUpdate = { ...updated, pageNumber: pageNum };

    const updateIn = (nodes: BookmarkNode[]): BookmarkNode[] => {
      return nodes.map(node => {
        if (node.id === finalUpdate.id) {
          return { ...finalUpdate, children: node.children };
        }
        return { ...node, children: updateIn(node.children) };
      });
    };

    setBookmarks(prev => updateIn(prev));
    setEditingBookmark(null);
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    const toggleIn = (nodes: BookmarkNode[]): BookmarkNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        return { ...node, children: toggleIn(node.children) };
      });
    };

    setBookmarks(prev => toggleIn(prev));
  }, []);

  const handleSortBookmarks = useCallback(() => {
    const sortNodes = (nodes: BookmarkNode[]): BookmarkNode[] => {
      const sorted = [...nodes].sort((a, b) => {
        if (a.pageNumber !== b.pageNumber) {
          return a.pageNumber - b.pageNumber;
        }
        return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
      });
      return sorted.map(node => ({
        ...node,
        children: sortNodes(node.children),
      }));
    };

    setBookmarks(prev => sortNodes(prev));
  }, []);

  // Move node for Drag and Drop
  const handleMoveNode = useCallback((sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    setBookmarks(prev => {
      let sourceNode: BookmarkNode | null = null;

      const removeNode = (nodes: BookmarkNode[]): BookmarkNode[] => {
        return nodes.filter(node => {
          if (node.id === sourceId) {
            sourceNode = { ...node };
            return false;
          }
          if (node.children && node.children.length > 0) {
            node.children = removeNode(node.children);
          }
          return true;
        });
      };

      const nodesWithoutSource = removeNode(JSON.parse(JSON.stringify(prev)));
      if (!sourceNode) return prev;

      const insertNode = (nodes: BookmarkNode[]): BookmarkNode[] => {
        const targetIndex = nodes.findIndex(node => node.id === targetId);
        if (targetIndex !== -1) {
          const result = [...nodes];
          if (position === 'before') {
            result.splice(targetIndex, 0, sourceNode!);
          } else if (position === 'after') {
            result.splice(targetIndex + 1, 0, sourceNode!);
          } else if (position === 'inside') {
            result[targetIndex] = {
              ...result[targetIndex],
              children: [...result[targetIndex].children, sourceNode!],
              isExpanded: true,
            };
          }
          return result;
        }

        return nodes.map(node => {
          if (node.children && node.children.length > 0) {
            return { ...node, children: insertNode(node.children) };
          }
          return node;
        });
      };

      return insertNode(nodesWithoutSource);
    });
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedNodeId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedNodeId || draggedNodeId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;

    if (mouseY < height * 0.25) {
      setDropPosition('before');
    } else if (mouseY > height * 0.75) {
      setDropPosition('after');
    } else {
      setDropPosition('inside');
    }
    setDragOverNodeId(targetId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedNodeId || !dropPosition || draggedNodeId === targetId) {
      setDraggedNodeId(null);
      setDragOverNodeId(null);
      setDropPosition(null);
      return;
    }

    handleMoveNode(draggedNodeId, targetId, dropPosition);
    setDraggedNodeId(null);
    setDragOverNodeId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedNodeId(null);
    setDragOverNodeId(null);
    setDropPosition(null);
  };

  return {
    bookmarks,
    setBookmarks,
    selectedBookmarkId,
    setSelectedBookmarkId,
    editingBookmark,
    setEditingBookmark,
    draggedNodeId,
    dragOverNodeId,
    dropPosition,
    handleBookmarkClick,
    handleAddBookmark,
    handleAddChild,
    handleDeleteBookmark,
    handleUpdateBookmark,
    handleToggleExpand,
    handleSortBookmarks,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
