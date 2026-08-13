import React from 'react';
import { useTranslations } from 'next-intl';
import type { BookmarkInfo } from '@/lib/pdf';
import { BookmarkIcon, CheckIcon, WarningIcon } from './icons/SplitIcons';

export interface BookmarkListProps {
  bookmarks: BookmarkInfo[];
}

export function BookmarkList({ bookmarks }: BookmarkListProps) {
  const tTools = useTranslations('tools');

  if (bookmarks.length === 0) {
    return (
      <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <WarningIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">No Bookmarks Found</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {tTools('splitPdf.bookmarksNotice') ||
                'This PDF does not contain bookmarks. The entire document will be returned as a single file.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success banner with gradient */}
      <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              {bookmarks.length} {bookmarks.length === 1 ? 'Bookmark' : 'Bookmarks'} Found
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Your PDF will be split into {bookmarks.length} separate files based on the bookmark structure
            </p>
          </div>
        </div>
      </div>

      {/* Bookmark list with modern styling */}
      <div className="rounded-xl border border-[hsl(var(--color-border))] overflow-hidden shadow-sm bg-[hsl(var(--color-background))]">
        <div className="px-4 py-3 bg-gradient-to-r from-[hsl(var(--color-muted)/0.5)] to-[hsl(var(--color-muted)/0.3)] border-b border-[hsl(var(--color-border))]">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-4 h-4 text-[hsl(var(--color-primary))]" />
            <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">
              Split Points
            </p>
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto">
          <ul className="divide-y divide-[hsl(var(--color-border)/0.5)]">
            {bookmarks.map((bookmark, index) => (
              <li
                key={index}
                className="group px-4 py-3 flex items-center justify-between transition-colors hover:bg-[hsl(var(--color-muted)/0.15)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))] text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-primary))]">
                    {bookmark.title}
                  </span>
                </div>
                <span className="ml-3 flex-shrink-0 px-2 py-1 rounded-md bg-[hsl(var(--color-muted)/0.4)] text-xs font-medium text-[hsl(var(--color-muted-foreground))]">
                  Page {bookmark.pageNumber}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {bookmarks.length > 5 && (
          <div className="px-4 py-2 bg-[hsl(var(--color-muted)/0.2)] border-t border-[hsl(var(--color-border)/0.5)] text-center">
            <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
              Scroll to see all {bookmarks.length} bookmarks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
