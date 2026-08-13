import React from 'react';
import { Button } from '@/components/ui/Button';
import type { BookmarkNode } from '../types';

export interface BookmarkNodeEditorProps {
  editingBookmark: BookmarkNode;
  setEditingBookmark: (node: BookmarkNode | null) => void;
  onSave: (node: BookmarkNode) => void;
  totalPages: number;
  t: (key: string) => string;
  tTools: (key: string) => string;
}

export function BookmarkNodeEditor({
  editingBookmark,
  setEditingBookmark,
  onSave,
  totalPages,
  t,
  tTools,
}: BookmarkNodeEditorProps) {
  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={editingBookmark.title}
          onChange={(e) => setEditingBookmark({ ...editingBookmark, title: e.target.value })}
          className="flex-1 px-2 py-1 border rounded text-sm h-8"
          placeholder={tTools('bookmark.titlePlaceholder') || 'Title'}
          autoFocus
        />
        <input
          type="number"
          min={1}
          max={totalPages || 9999}
          value={editingBookmark.pageNumber}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setEditingBookmark({ ...editingBookmark, pageNumber: isNaN(val) ? 1 : val });
          }}
          className="w-20 px-2 py-1 border rounded text-sm h-8"
          title={tTools('bookmark.pageNumber') || 'Page Number'}
        />
      </div>
      <div className="flex gap-2 items-center">
        <div>
          <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">{tTools('bookmark.color') || 'Color'}</label>
          <input
            type="color"
            value={editingBookmark.color || '#000000'}
            onChange={(e) => setEditingBookmark({ ...editingBookmark, color: e.target.value })}
            className="w-10 h-8 p-0 border rounded cursor-pointer"
            title={tTools('bookmark.color') || 'Color'}
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">{tTools('bookmark.style') || 'Style'}</label>
          <select
            value={editingBookmark.style || ''}
            onChange={(e) => setEditingBookmark({ ...editingBookmark, style: (e.target.value as any) || undefined })}
            className="w-full px-2 py-1 border rounded text-sm h-8"
          >
            <option value="">{tTools('bookmark.normal') || 'Normal'}</option>
            <option value="bold">{tTools('bookmark.bold') || 'Bold'}</option>
            <option value="italic">{tTools('bookmark.italic') || 'Italic'}</option>
            <option value="bold-italic">{tTools('bookmark.boldItalic') || 'Bold & Italic'}</option>
          </select>
        </div>
        <div className="flex gap-1 self-end mb-0.5">
          <Button size="sm" onClick={() => onSave(editingBookmark)} title={t('buttons.save') || 'Save'}>✓</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingBookmark(null)} title={t('buttons.cancel') || 'Cancel'}>✕</Button>
        </div>
      </div>
    </div>
  );
}
