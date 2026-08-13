import React from 'react';
import type { BookmarkNode, DropPosition } from '../types';
import { BookmarkNodeEditor } from './BookmarkNodeEditor';

export interface BookmarkTreeProps {
  bookmarks: BookmarkNode[];
  selectedBookmarkId: string | null;
  editingBookmark: BookmarkNode | null;
  draggedNodeId: string | null;
  dragOverNodeId: string | null;
  dropPosition: DropPosition;
  totalPages: number;
  onBookmarkClick: (bookmark: BookmarkNode) => void;
  onToggleExpand: (id: string) => void;
  onAddChild: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onEditBookmark: (bookmark: BookmarkNode) => void;
  setEditingBookmark: (bookmark: BookmarkNode | null) => void;
  onSaveBookmark: (bookmark: BookmarkNode) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  t: (key: string) => string;
  tTools: (key: string) => string;
}

export function BookmarkTree({
  bookmarks,
  selectedBookmarkId,
  editingBookmark,
  draggedNodeId,
  dragOverNodeId,
  dropPosition,
  totalPages,
  onBookmarkClick,
  onToggleExpand,
  onAddChild,
  onDeleteBookmark,
  onEditBookmark,
  setEditingBookmark,
  onSaveBookmark,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  t,
  tTools,
}: BookmarkTreeProps) {
  const renderItem = (bookmark: BookmarkNode, depth = 0) => {
    const isSelected = selectedBookmarkId === bookmark.id;
    const isEditing = editingBookmark?.id === bookmark.id;
    const isDragging = draggedNodeId === bookmark.id;
    const isDragOver = dragOverNodeId === bookmark.id;

    let borderStyle = '';
    if (isDragOver && dropPosition) {
      if (dropPosition === 'before') borderStyle = 'border-t-2 border-blue-500';
      else if (dropPosition === 'after') borderStyle = 'border-b-2 border-blue-500';
      else if (dropPosition === 'inside') borderStyle = 'bg-blue-100 border-2 border-blue-500';
    }

    return (
      <div key={bookmark.id} className="space-y-1">
        <div
          draggable={!isEditing}
          onDragStart={(e) => onDragStart(e, bookmark.id)}
          onDragOver={(e) => onDragOver(e, bookmark.id)}
          onDrop={(e) => onDrop(e, bookmark.id)}
          onDragEnd={onDragEnd}
          onClick={() => onBookmarkClick(bookmark)}
          className={`flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group transition-all duration-150 ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          } ${isDragging ? 'opacity-30' : ''} ${borderStyle}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Drag Handle */}
          <span className="text-gray-400 cursor-grab active:cursor-grabbing text-xs opacity-0 group-hover:opacity-100 hover:opacity-100 select-none">
            ⋮⋮
          </span>

          {/* Expand/Collapse */}
          {bookmark.children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(bookmark.id);
              }}
              className="w-4 h-4 flex items-center justify-center text-xs text-gray-500 hover:text-black"
            >
              {bookmark.isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Title or Editor */}
          {isEditing && editingBookmark ? (
            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
              <BookmarkNodeEditor
                editingBookmark={editingBookmark}
                setEditingBookmark={setEditingBookmark}
                onSave={onSaveBookmark}
                totalPages={totalPages}
                t={t}
                tTools={tTools}
              />
            </div>
          ) : (
            <>
              <span
                className={`flex-1 text-sm truncate ${
                  bookmark.style === 'bold'
                    ? 'font-bold'
                    : bookmark.style === 'italic'
                    ? 'italic'
                    : bookmark.style === 'bold-italic'
                    ? 'font-bold italic'
                    : ''
                }`}
                style={{ color: bookmark.color }}
              >
                {bookmark.title}
              </span>
              <span className="text-xs text-gray-500">p.{bookmark.pageNumber}</span>

              {/* Actions */}
              <div
                className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100"
                style={{ opacity: isSelected ? 1 : undefined }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditBookmark(bookmark);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-500"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChild(bookmark.id);
                  }}
                  className="p-1 text-gray-400 hover:text-green-500"
                  title="Add child"
                >
                  +
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBookmark(bookmark.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </>
          )}
        </div>

        {/* Children */}
        {bookmark.isExpanded && bookmark.children.length > 0 && (
          <div className="border-l border-gray-200 ml-2">
            {bookmark.children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return <div className="p-2 space-y-1">{bookmarks.map((b) => renderItem(b))}</div>;
}
